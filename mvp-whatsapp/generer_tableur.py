#!/usr/bin/env python3
"""Génère le tableur du test WhatsApp (mode d'emploi : docs/mvp-whatsapp.md).

Usage : python3 generer_tableur.py   (nécessite openpyxl)
Le fichier produit s'importe dans Google Sheets. Les formules utilisent des fonctions propres à Google Sheets
(REGEXREPLACE, TO_TEXT) : elles ne se calculent pas correctement dans Excel.

Principe : le statut de chaque annonce est la seule source de vérité. Les jetons sont recalculés à partir
des annonces : il n'y a aucun solde à modifier à la main.
"""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

SORTIE = Path(__file__).with_name('e-mirror-test-whatsapp.xlsx')
NB_ANNONCES = 300
NB_MEMBRES = 150
STATUTS = ['En ligne', 'Réservée', 'Remise', 'Retirée', 'Refusée']
CATEGORIES = ['T-shirt, top', 'Chemise, pull, veste', 'Pantalon, jean, jupe', 'Robe', 'Chaussures', 'Manteau', 'Autre']

ENTETE = PatternFill('solid', fgColor='F2B705')
A_REMPLIR = PatternFill('solid', fgColor='FCEFC7')
ALERTE = PatternFill('solid', bgColor='F2946A')
POLICE_ENTETE = Font(bold=True, color='2B2118')


def reponse(colonne: str) -> str:
    """Valeur de la même ligne dans l'onglet Réponses. INDIRECT : le formulaire insère des lignes sans casser le lien."""
    return f"INDIRECT(\"'Réponses'!{colonne}\"&ROW())"


def champ(colonne: str) -> str:
    # IFERROR : tant que l'onglet Réponses n'existe pas, la ligne reste vide.
    return f'=IFERROR(IF({reponse(colonne)}="","",{reponse(colonne)}),"")'


def titres(feuille, libelles, largeurs):
    for indice, (libelle, largeur) in enumerate(zip(libelles, largeurs), start=1):
        cellule = feuille.cell(row=1, column=indice, value=libelle)
        cellule.fill = ENTETE
        cellule.font = POLICE_ENTETE
        cellule.alignment = Alignment(wrap_text=True, vertical='center')
        feuille.column_dimensions[get_column_letter(indice)].width = largeur
    feuille.freeze_panes = 'A2'
    feuille.row_dimensions[1].height = 34


def creer_reglages(classeur):
    feuille = classeur.active
    feuille.title = 'Réglages'
    lignes = [
        ('Réglage', 'Valeur', 'Explication'),
        ('Numéro WhatsApp du concierge', '33600000000', 'À REMPLACER : ton numéro au format international, sans + ni espace.'),
        ('Inscrits au canal WhatsApp', 0, 'À mettre à jour : nombre de membres du canal, pour calculer la part de ceux qui publient.'),
        ('Réservations en cours au maximum', 3, 'Règle de docs/03-communaute-echange.md.'),
    ]
    for ligne in lignes:
        feuille.append(ligne)
    for colonne in 'ABC':
        feuille[f'{colonne}1'].fill = ENTETE
        feuille[f'{colonne}1'].font = POLICE_ENTETE
    # Le numéro reste du texte : il ne doit pas être reformaté.
    feuille['B2'].number_format = '@'
    feuille['B2'].fill = A_REMPLIR
    feuille['B3'].fill = A_REMPLIR
    feuille.column_dimensions['A'].width = 36
    feuille.column_dimensions['B'].width = 18
    feuille.column_dimensions['C'].width = 90


def creer_annonces(classeur):
    feuille = classeur.create_sheet('Annonces')
    titres(
        feuille,
        ['Numéro', 'Date', 'WhatsApp donneur', 'Prénom', 'Donneur', 'Pièce', 'Catégorie', 'Taille', 'État', 'Un mot',
         'Photo', 'Statut (à remplir)', 'Receveur (à remplir)', 'Date réservation (à remplir)',
         'Date remise (à remplir)', 'Annulations (à remplir)', 'Absences (à remplir)', 'Contrôle', 'Message à publier',
         'Jours avant réservation', 'Jours avant remise'],
        [9, 12, 16, 16, 22, 28, 20, 8, 18, 28, 22, 14, 22, 14, 14, 12, 10, 22, 60, 12, 12],
    )
    for n in range(2, NB_ANNONCES + 2):
        feuille[f'A{n}'] = f'=IFERROR(IF({reponse("A")}="","","P"&TEXT(ROW()-1,"000")),"")'
        feuille[f'B{n}'] = champ('A')
        feuille[f'B{n}'].number_format = 'dd/mm/yyyy'
        # Numéro normalisé : 06…, 6… (zéro perdu par le tableur), +33… et 0033… donnent tous 336….
        nettoye = f'REGEXREPLACE(TO_TEXT({reponse("C")}),"[^0-9]","")'
        sans_00 = f'REGEXREPLACE({nettoye},"^00","")'
        sans_0 = f'REGEXREPLACE({sans_00},"^0","33")'
        feuille[f'C{n}'] = f'=IF(A{n}="","",REGEXREPLACE({sans_0},"^([1-9][0-9]{{8}})$","33$1"))'
        feuille[f'D{n}'] = champ('B')
        feuille[f'E{n}'] = f'=IF(C{n}="","",IFERROR(INDEX(Membres!$C$2:$C${NB_MEMBRES + 1},MATCH(C{n},Membres!$A$2:$A${NB_MEMBRES + 1},0)),""))'
        for cible, source in zip('FGHIJK', 'DEFGHI'):
            feuille[f'{cible}{n}'] = champ(source)
        disponibles = f'IFERROR(INDEX(Membres!$H$2:$H${NB_MEMBRES + 1},MATCH(M{n},Membres!$C$2:$C${NB_MEMBRES + 1},0)),0)'
        feuille[f'R{n}'] = (
            f'=IF(OR(L{n}="Réservée",L{n}="Remise"),IF(M{n}="","Receveur manquant",IF(M{n}=E{n},"Même personne",'
            f'IF({disponibles}<0,"Jetons insuffisants",""))),IF(AND(L{n}<>"Réservée",L{n}<>"Remise",M{n}<>""),"Effacer le receveur",""))'
        )
        feuille[f'S{n}'] = (
            f'=IF(A{n}="","","#"&A{n}&" · "&F{n}&CHAR(10)&G{n}&IF(H{n}<>""," · Taille "&H{n},"")&" · "&I{n}'
            f'&IF(J{n}<>"",CHAR(10)&"« "&J{n}&" »","")&CHAR(10)&"Réclamer pour 1 jeton : https://wa.me/"'
            f"&'Réglages'!$B$2&\"?text=\"&ENCODEURL(\"Je réclame #\"&A{n}))"
        )
        feuille[f'S{n}'].alignment = Alignment(wrap_text=True, vertical='top')
        feuille[f'T{n}'] = f'=IF(OR(N{n}="",B{n}=""),"",INT(N{n})-INT(B{n}))'
        feuille[f'U{n}'] = f'=IF(OR(O{n}="",B{n}=""),"",INT(O{n})-INT(B{n}))'
        for colonne in 'LMNOPQ':
            feuille[f'{colonne}{n}'].fill = A_REMPLIR
        for colonne in 'NO':
            feuille[f'{colonne}{n}'].number_format = 'dd/mm/yyyy'

    derniere = NB_ANNONCES + 1
    statut = DataValidation(type='list', formula1=f'"{",".join(STATUTS)}"', allow_blank=True)
    receveur = DataValidation(type='list', formula1=f'=Membres!$C$2:$C${NB_MEMBRES + 1}', allow_blank=True)
    feuille.add_data_validation(statut)
    feuille.add_data_validation(receveur)
    statut.add(f'L2:L{derniere}')
    receveur.add(f'M2:M{derniere}')
    feuille.conditional_formatting.add(f'R2:R{derniere}', FormulaRule(formula=['LEN($R2)>0'], fill=ALERTE))


def creer_membres(classeur):
    feuille = classeur.create_sheet('Membres')
    titres(
        feuille,
        ['WhatsApp', 'Prénom', 'Membre', 'Jeton de lancement', 'Jetons gagnés', 'Jetons utilisés', 'Jetons bloqués',
         'Jetons disponibles', 'Alerte', 'Écrire'],
        [16, 18, 24, 11, 9, 10, 9, 12, 26, 44],
    )
    annonces = f'Annonces!$C$2:$C${NB_ANNONCES + 1}'
    feuille['A2'] = f'=IFERROR(UNIQUE(FILTER({annonces},{annonces}<>"")),"")'
    donneur = f'Annonces!$E$2:$E${NB_ANNONCES + 1}'
    receveur = f'Annonces!$M$2:$M${NB_ANNONCES + 1}'
    statut = f'Annonces!$L$2:$L${NB_ANNONCES + 1}'
    for n in range(2, NB_MEMBRES + 2):
        feuille[f'B{n}'] = f'=IF(A{n}="","",INDEX(Annonces!$D$2:$D${NB_ANNONCES + 1},MATCH(A{n},{annonces},0)))'
        # Libellé unique, même si deux membres ont le même prénom.
        feuille[f'C{n}'] = f'=IF(A{n}="","",B{n}&" · "&RIGHT(A{n},4))'
        publiees = '+'.join(f'COUNTIFS({donneur},C{n},{statut},"{s}")' for s in ['En ligne', 'Réservée', 'Remise'])
        feuille[f'D{n}'] = f'=IF(A{n}="","",IF({publiees}>0,1,0))'
        feuille[f'E{n}'] = f'=IF(A{n}="","",COUNTIFS({donneur},C{n},{statut},"Remise"))'
        feuille[f'F{n}'] = f'=IF(A{n}="","",COUNTIFS({receveur},C{n},{statut},"Remise"))'
        feuille[f'G{n}'] = f'=IF(A{n}="","",COUNTIFS({receveur},C{n},{statut},"Réservée"))'
        feuille[f'H{n}'] = f'=IF(A{n}="","",D{n}+E{n}-F{n}-G{n})'
        feuille[f'I{n}'] = (
            f'=IF(A{n}="","",IF(H{n}<0,"Jetons insuffisants",IF(G{n}>\'Réglages\'!$B$4,"Trop de réservations","")))'
        )
        feuille[f'J{n}'] = f'=IF(A{n}="","","https://wa.me/"&A{n})'
    feuille.conditional_formatting.add(
        f'I2:I{NB_MEMBRES + 1}', FormulaRule(formula=['LEN($I2)>0'], fill=ALERTE)
    )


def creer_mesures(classeur):
    feuille = classeur.create_sheet('Mesures')
    feuille.column_dimensions['A'].width = 48
    feuille.column_dimensions['B'].width = 14
    feuille.column_dimensions['C'].width = 14
    feuille.column_dimensions['D'].width = 14
    fin = NB_ANNONCES + 1
    fin_m = NB_MEMBRES + 1
    statut = f'Annonces!$L$2:$L${fin}'
    categorie = f'Annonces!$G$2:$G${fin}'

    publiees = f'(COUNTIF({statut},"En ligne")+COUNTIF({statut},"Réservée")+COUNTIF({statut},"Remise"))'
    lignes = [
        ('Mesure', 'Valeur', 'Seuil fixé avant le test'),
        ('Inscrits au canal', "='Réglages'!B3"),
        ('Membres ayant proposé une pièce', f'=SUMPRODUCT(--(Membres!$A$2:$A${fin_m}<>""))'),
        ('Part des inscrits qui proposent une pièce', '=IF(B2=0,"",B3/B2)'),
        ('Pièces publiées', f'={publiees}'),
        ('Pièces réservées en ce moment', f'=COUNTIF({statut},"Réservée")'),
        ('Pièces remises', f'=COUNTIF({statut},"Remise")'),
        ('Part des pièces publiées qui ont été remises', '=IF(B5=0,"",B7/B5)'),
        ('Jours moyens avant réservation', f'=IFERROR(AVERAGE(Annonces!$T$2:$T${fin}),"")'),
        ('Jours moyens avant remise', f'=IFERROR(AVERAGE(Annonces!$U$2:$U${fin}),"")'),
        ('Annulations', f'=SUM(Annonces!$P$2:$P${fin})'),
        ('Absences', f'=SUM(Annonces!$Q$2:$Q${fin})'),
        ('Membres qui ont gagné au moins 1 jeton', f'=COUNTIF(Membres!$E$2:$E${fin_m},">0")'),
        ('Membres qui ont utilisé au moins 1 jeton', f'=COUNTIF(Membres!$F$2:$F${fin_m},">0")'),
        ('Membres qui ont donné ET reçu', f'=COUNTIFS(Membres!$E$2:$E${fin_m},">0",Membres!$F$2:$F${fin_m},">0")'),
        ('Part des donneurs qui ont aussi reçu', '=IF(B13=0,"",B15/B13)'),
        ('Jetons disponibles non utilisés', f'=SUM(Membres!$H$2:$H${fin_m})'),
    ]
    for ligne in lignes:
        feuille.append(ligne)
    for colonne in 'ABC':
        feuille[f'{colonne}1'].fill = ENTETE
        feuille[f'{colonne}1'].font = POLICE_ENTETE
    for n in range(2, len(lignes) + 1):
        feuille[f'C{n}'].fill = A_REMPLIR
    for n in (4, 8, 16):
        feuille[f'B{n}'].number_format = '0%'
    for n in (9, 10):
        feuille[f'B{n}'].number_format = '0.0'

    depart = len(lignes) + 2
    for indice, libelle in enumerate(['Par catégorie', 'Publiées', 'Remises', 'Part remise'], start=1):
        cellule = feuille.cell(row=depart, column=indice, value=libelle)
        cellule.fill = ENTETE
        cellule.font = POLICE_ENTETE
    # Décision n° 13 de docs/08 : montre si certaines pièces partent bien plus vite que d'autres.
    for decalage, nom in enumerate(CATEGORIES, start=1):
        n = depart + decalage
        feuille[f'A{n}'] = nom
        feuille[f'B{n}'] = '=' + '+'.join(
            f'COUNTIFS({categorie},$A{n},{statut},"{s}")' for s in ['En ligne', 'Réservée', 'Remise']
        )
        feuille[f'C{n}'] = f'=COUNTIFS({categorie},$A{n},{statut},"Remise")'
        feuille[f'D{n}'] = f'=IF(B{n}=0,"",C{n}/B{n})'
        feuille[f'D{n}'].number_format = '0%'


def main():
    classeur = Workbook()
    creer_reglages(classeur)
    creer_annonces(classeur)
    creer_membres(classeur)
    creer_mesures(classeur)
    classeur.save(SORTIE)
    print(f'Écrit : {SORTIE}')


if __name__ == '__main__':
    main()

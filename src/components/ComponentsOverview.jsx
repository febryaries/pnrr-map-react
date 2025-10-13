import { useState } from 'react'
import { fmtMoney, COMPONENT_MAPPING_PAYMENTS } from '../data/data'

const ComponentsOverview = ({ currency = 'EUR' }) => {
  const [expandedComponents, setExpandedComponents] = useState(new Set())
  
  // Helper function to convert EUR to RON if needed
  const convertValue = (eurValue) => {
    return currency === 'RON' ? eurValue * 5 : eurValue
  }
  
  // Helper function to format money with correct currency
  const formatMoney = (eurValue) => {
    const value = convertValue(eurValue)
    return fmtMoney(value, currency)
  }

  // Real component data in EUR
  const componentsData = {
    'C1': {
      code: 'C1',
      name: 'Managementul apei',
      totalValue: 403316982,
      investments: [
        { description: 'I1. Extinderea sistemelor de apă și canalizare în aglomerări mai mari de 2000 de locuitori echivalenți', value: 244838539 },
        { description: 'I2. Colectarea apelor uzate în aglomerări mai mici de 2.000 de locuitori echivalenți, care împiedică atingerea unei stări bune a corpurilor de apă și/sau afectează arii naturale protejate', value: 57974587 },
        { description: 'I4. Adaptarea la schimbările climatice prin automatizarea și digitalizarea echipamentelor de evacuare și stocare a apei la acumulări existente pentru asigurarea debitului ecologic și creșterea siguranței alimentării cu apă a populației și reducerea riscului la inundații.', value: 33003856 },
        { description: 'I5. Dotarea adecvată a administrațiilor bazinale pentru monitorizarea infrastructurii, prevenirea și gestionarea situațiilor de urgență', value: 35000000 },
        { description: 'I7. Extinderea rețelei naționale de observații din cadrul Sistemului Meteorologic Integrat Național (SIMIN)', value: 30000000 }
      ],
      reforms: [
        { description: 'R1. Consolidarea cadrului de reglementare pentru managementul sustenabil al sectorului de apă și apă uzată și pentru accelerarea accesului populației la servicii de calitate conform directivelor europene', value: 0 },
        { description: 'R2. Reconfigurarea actualului mecanism economic al ANAR în vederea asigurării modernizării și întreținerii sistemului național de gospodărire a apelor, precum și a implementării corespunzătoare a Directivei-cadru privind apa și a Directivei privind inundațiile', value: 2500000 }
      ]
    },
    'C2': {
      code: 'C2',
      name: 'Protejarea pădurilor și a biodiversității',
      totalValue: 395548498,
      investments: [
        { description: 'I1. Campania națională de împădurire și reîmpădurire, inclusiv păduri urbane', value: 307547498 },
        { description: 'I2. Dezvoltarea de capacități moderne de producere a materialului forestier de reproducere', value: 50000000 },
        { description: 'I3. Actualizarea planurilor de management aprobate și identificarea zonelor potențiale de protecție strictă în habitate naturale terestre și marine în vederea punerii în aplicare a Strategiei UE privind biodiversitatea pentru 2030', value: 5000000 },
        { description: 'I4. Investiții integrate de reconstrucție ecologică a habitatelor și conservarea speciilor aferente pajiștilor, zonelor acvatice și dependente de apă', value: 10001000 },
        { description: 'I5. Sisteme integrate de reducere a riscurilor generate de viituri torențiale în bazinete forestiere expuse unor astfel de fenomene', value: 22000000 }
      ],
      reforms: [
        { description: 'R1. Rsistemului de management și a celui privind guvernanța în domeniul forestier prin dezvoltarea unei noi Strategii forestiere naționale și a legislației subsecvente', value: 1000000 },
        { description: 'R2. Reforma sistemului de management al ariilor naturale protejate în vederea implementării coerente și eficace a Strategiei Europene privind biodiversitate', value: 0 }
      ]
    },
    'C3': {
      code: 'C3',
      name: 'Managementul deșeurilor',
      totalValue: 468946895,
      investments: [
        { description: 'I1. Dezvoltarea, modernizarea și completarea sistemelor de management integrat al deșeurilor municipale la nivel de județ sau la nivel de orașe/comune', value: 405750045 },
        { description: 'I2. Dezvoltarea infrastructurii pentru managementul gunoiului de grajd și al altor deșeuri agricole compostabile', value: 50196850 },
        { description: 'I3. Dezvoltarea capacităților instituționale de monitorizare publică și control pentru gestionarea deșeurilor și prevenirea poluării', value: 13000000 }
      ],
      reforms: [
        { description: 'R1. Îmbunătățirea guvernanței în domeniul gestionării deșeurilor în vederea accelerării tranziției către economia circulară.', value: 0 }
      ]
    },
    'C4': {
      code: 'C4',
      name: 'Transport sustenabil',
      totalValue: 5452231000,
      investments: [
        { description: 'I1. Modernizarea și reînnoirea infrastructurii feroviare', value: 1874380000 },
        { description: 'I2- Material rulant feroviar', value: 280830000 },
        { description: 'I3. Dezvoltarea infrastructurii rutiere durabile aferente rețelei TEN-T, taxarea drumurilor, managementul traficului și siguranța rutieră - 5 loturi A7 si Infrastructura aferentă operaționalizării sistemelor de trafic inteligent – centru de management al traficului, sisteme de informare a utilizatorilor, interoperabilitatea sistemelor de transport', value: 3268021000 }
      ],
      reforms: [
        { description: 'R1. Transport sustenabil, decarbonizare și siguranță rutieră /Decarbonizarea rutieră în conformitate cu principiul „poluatorul plătește"', value: 10000000 },
        { description: 'R2. Management performant pentru transport de calitate - Îmbunătățirea capacității instituționale de management și guvernanță corporativă', value: 19000000 }
      ]
    },
    'C5': {
      code: 'C5',
      name: 'Valul Renovării',
      totalValue: 1933402716,
      investments: [
        { description: 'I1. Instituirea unui fond pentru Valul Renovării care să finanțeze lucrări de îmbunătățire a eficienței energetice a fondului construit', value: 1913402716 },
        { description: 'I2. Implementarea Registrului național al clădirilor', value: 5000000 },
        { description: 'I4. Economie circulară și creșterea eficienței energetice a clădirilor istorice*', value: 14850000 }
      ],
      reforms: [
        { description: 'R1. Realizarea unui cadru normativ simplificat și actualizat care să sprijine implementarea investițiilor în tranziția spre clădiri verzi și reziliente', value: 150000 },
        { description: 'R2. Cadru strategic, normativ și procedural care să sprijine reziliența seismică a fondului construit', value: 0 }
      ]
    },
    'C6': {
      code: 'C6',
      name: 'Energie',
      totalValue: 367877743,
      investments: [
        { description: 'I2. Capacitățile de producție a hidrogenului verde care să fie utilizat pentru stocarea energiei electrice și/sau pentru decarbonizarea industriei', value: 86500000 },
        { description: 'I3. Dezvoltarea unei producții combinate de energie termică și energie electrică (CHP) pe gaz flexibile și de înaltă eficiență în sectorul încălzirii centralizate, în vederea atingerii unei decarbonizări adânci', value: 86377743 },
        { description: 'I4. Lanț industrial de producție și/sau asamblare și/sau reciclare a bateriilor, a celulelor și panourilor fotovoltaice (inclusiv echipamente auxiliare) și noi capacități de stocare a energiei electrice', value: 130000000 },
        { description: 'I5. Asigurarea eficienței energetice în sectorul industrial', value: 64000000 }
      ],
      reforms: [
        { description: 'R1. Reforma pieței de energie electrică, prin înlocuirea cărbunelui din mixul energetic și susținerea unui cadru legislativ și de reglementare stimulativ pentru investițiile private în producția de electricitate din surse regenerabile', value: 0 },
        { description: 'R2. Îmbunătățirea guvernanței corporative a întreprinderilor de stat din sectorul energetic', value: 0 },
        { description: 'R3. Bugetarea verde', value: 0 },
        { description: 'R4. Dezvoltarea unui cadru legislativ și de reglementare favorabil tehnologiilor viitorului, în special hidrogen și soluții de stocare', value: 1000000 },
        { description: 'R5. Reducerea intensității energetice a economiei prin dezvoltarea unui mecanism sustenabil de stimulare a eficienței energetice în industrie şi de creștere a rezilienței', value: 0 },
        { description: 'R6. Creșterea competitivității și decarbonizarea sectorului de încălzire – răcire', value: 0 }
      ]
    },
    'C7': {
      code: 'C7',
      name: 'Transformare digitală',
      totalValue: 1739439337,
      investments: [
        { description: 'I1. Implementarea infrastructurii de cloud guvernamental', value: 374728570 },
        { description: 'I2. Dezvoltarea cloudului și migrarea în cloud.', value: 187050420 },
        { description: 'I3. Realizarea sistemului de eHealth și telemedicină  - I3.1 Redimensionare, standardizare și optimizare a Platformei informatice din asigurările de sănătate (PIAS)', value: 100000000 },
        { description: 'I3. Realizarea sistemului de eHealth și telemedicină - I3.2. Digitalizarea instituțiilor cu atribuții în domeniul sanitar aflate în subordinea MS', value: 100000000 },
        { description: 'I3. Realizarea sistemului de eHealth și telemedicină - I3.3  Digitalizarea a 200 de unități sanitare publice', value: 100000000 },
        { description: 'I4. Digitalizarea sistemului judiciar', value: 242310000 },
        { description: 'I5. Digitalizare în domeniul mediului', value: 47951280 },
        { description: 'I6. Digitalizarea în domeniul muncii și protecției sociale', value: 85000000 },
        { description: 'I7. Implementarea formularelor electronice eForms în domeniul achizițiilor publice', value: 851600 },
        { description: 'I8. Cartea de identitate electronică și semnătura digitală', value: 129000000 },
        { description: 'I9. Digitalizarea sectorului organizațiilor neguvernamentale', value: 12000000 },
        { description: 'I10. Transformarea digitală în managementul funcției publice', value: 10000000 },
        { description: 'I 11. Implementarea unei scheme de sprijinire a utilizării serviciilor de comunicații prin diferite tipuri de instrumente pentru beneficiari, cu accent pe zonele albe', value: 94000000 },
        { description: 'I 12. Asigurarea protecției cibernetice atât pentru infrastructurile TIC publice, cât și pentru cele private cu valențe critic e pentru securitatea națională, prin utilizarea tehnologiilor inteligente', value: 100000000 },
        { description: 'I 13. Dezvoltarea sistemelor de securitate pentru protecția spectrului guvernamental', value: 38530000 },
        { description: 'I 14. Sporirea rezilienței și a securității cibernetice a serviciilor de infrastructură ale furnizorilor de servicii de internet pentru autoritățile publice din România', value: 18393501 },
        { description: 'I 15. Crearea de noi competențe de securitate cibernetică pentru societate și economie', value: 11310000 },
        { description: 'I16. Program de formare de competențe digitale avansate pentru funcționarii publici', value: 20000000 },
        { description: 'I 17. Scheme de finanțare pentru biblioteci pentru a deveni hub-uri de dezvoltare a competențelor digitale', value: 22624468 },
        { description: 'I 18. Transformarea digitală și adoptarea tehnologiei de automatizare a proceselor de lucru robotice în administrația publică. (sub conditia semnarii contractului de achizitie in cursul lunii august 2025)', value: 14800000 },
        { description: 'I 19. Scheme dedicate perfecționării/recalificării angajaților din firme', value: 19000000 }
      ],
      reforms: [
        { description: 'R1. Dezvoltarea unui cadru unitar pentru definirea arhitecturii unui sistem de tip cloud guvernamental', value: 11889498 },
        { description: 'R2. Tranziția către atingerea obiectivelor de conectivitate UE 2025 și stimularea investițiilor private pentru dezvoltarea rețelelor de foarte mare capacitate', value: 0 }
      ]
    },
    'C8': {
      code: 'C8',
      name: 'Reforme fiscale și Rpensiilor',
      totalValue: 556932515,
      investments: [
        { description: 'I1. Creșterea conformării voluntare a contribuabililor prin dezvoltarea serviciilor digitale', value: 7000000 },
        { description: 'I2. Îmbunătățirea proceselor de administrare a impozitelor și taxelor, inclusiv prin implementarea managementului integrat al riscurilor', value: 196400000 },
        { description: 'I3. Asigurarea capacității de răspuns la provocările informaționale actuale și viitoare, inclusiv în contextul pandemiei, prin transformarea digitală a Ministerului de Finanțe/Agenției Naționale de Administrare Fiscală', value: 88000000 },
        { description: 'I4. Implementarea vămii electronice', value: 61999999 },
        { description: 'I5. Îmbunătățirea mecanismului de programare bugetară', value: 4000000 },
        { description: 'I6. Instrument de modelare economică (set de instrumente de simulare privind opțiunile de reformă a pensiilor) pentru îmbunătățirea capacității instituționale de a prognoza cheltuielile cu pensiile', value: 400000 },
        { description: 'I7. Asistență tehnică pentru revizuirea cadrului fiscal', value: 4000000 },
        { description: 'I8. Operaționalizarea Băncii Naționale de Dezvoltare', value: 10000000 },
        { description: 'I9. Susținerea procesului de evaluare a dosarelor de pensii aflate în plată', value: 19250597 },
        { description: 'I10. Eficiență operațională și servicii electronice avansate pentru sistemul național de pensii prin digitalizare.', value: 61881919 },
        { description: 'I11. Capitalizare BID', value: 100000000 }
      ],
      reforms: [
        { description: 'R1. Reforma Agenției Naționale de Administrare Fiscală (ANAF) prin digitalizare', value: 0 },
        { description: 'R2. Modernizarea sistemului vamal și implementarea vămii electronice', value: 0 },
        { description: 'R3. Îmbunătățirea mecanismului de programare bugetară', value: 0 },
        { description: 'R4. Revizuirea cadrului fiscal', value: 0 },
        { description: 'R5. Crearea și operaționalizarea Băncii Naționale de Dezvoltare', value: 0 },
        { description: 'R6. Reforma sistemului public de pensii', value: 4000000 }
      ]
    },
    'C9': {
      code: 'C9',
      name: 'Sprijin pentru mediul de afaceri și cercetare, dezvoltare și inovare',
      totalValue: 2129427170,
      investments: [
        { description: 'I1.Platforme digitale privind transparentizarea legislativă, debirocratizarea și simplificarea procedurală destinate mediului de afaceri', value: 5297170 },
        { description: 'I 2. Instrumente financiare pentru sectorul privat', value: 1250000000 },
        { description: 'I 3. Scheme de ajutor pentru sectorul privat', value: 257100000 },
        { description: 'I 4. Proiecte transfrontaliere și multinaționale – Procesoare cu consum redus de energie și cipuri semiconductoare', value: 400000000 },
        { description: 'I5. Înființarea și operaționalizarea centrelor de competență', value: 25000000 },
        { description: 'I8. Dezvoltarea unui program pentru atragerea resurselor umane înalt specializate din străinătate pentru activități de cercetare, dezvoltare, inovare (T284)', value: 183000000 },
        { description: 'I9. Program de sprijin pentru posesorii de certificate de excelență primite la competiția pentru burse individuale Marie Sklodowska Curie (T285)', value: 1600000 },
        { description: 'I10. Înființarea și susținerea financiară a unei rețele naționale de (8) opt centre regionale de orientare în carieră ca parte a ERA TALENT PLATFORM', value: 4000000 }
      ],
      reforms: [
        { description: 'R1. Transparentizare legislativă, debirocratizare și simplificare procedurală destinate mediului de afaceri', value: 0 },
        { description: 'R2. Raționalizarea guvernanței în domeniul cercetării, dezvoltării și inovării', value: 3430000 },
        { description: 'R3. Reforma carierei de cercetător', value: 0 },
        { description: 'R4. Consolidarea cooperării dintre mediul de afaceri și cel de cercetare', value: 0 },
        { description: 'R5. Sprijin pentru integrarea organizațiilor de cercetare, dezvoltare și inovare din România în Spațiul european de cercetare', value: 0 }
      ]
    },
    'C10': {
      code: 'C10',
      name: 'Fondul local',
      totalValue: 1649538789,
      investments: [
        { description: 'I1. Mobilitate urbană durabilă', value: 904000000 },
        { description: 'I2. Construcția de locuințe pentru tineri / locuințe pentru specialiști în sănătate și educație', value: 145341508 },
        { description: 'I3. Reabilitarea moderată a clădirilor publice pentru a îmbunătăți furnizarea de servicii publice de către unitățile administrativ-teritoriale', value: 575000000 },
        { description: 'I4. Elaborarea / actualizarea în format GIS a documentelor de amenajare a teritoriului și de urbanism', value: 25197281 }
      ],
      reforms: [
        { description: 'R1. Crearea cadrului pentru mobilitate urbană durabilă', value: 0 },
        { description: 'R2. Crearea cadrului de politică pentru o transformare urbană durabilă – Politica urbană a României', value: 0 },
        { description: 'R3. Crearea unui cadru de politică pentru o transformare rurală durabilă: instituirea de consorții administrative în zonele rurale funcționale', value: 0 },
        { description: 'R4. Îmbunătățirea calității locuirii', value: 0 },
        { description: 'R5. Dezvoltarea sistemului de planificare – Codul amenajării teritoriului, urbanismului și construcțiilor', value: 0 }
      ]
    },
    'C11': {
      code: 'C11',
      name: 'Turism și cultura',
      totalValue: 191336081,
      investments: [
        { description: 'I1. Promovarea celor 12 rute turistice/culturale', value: 102805000 },
        { description: 'I2. Modernizarea/crearea de muzee și memoriale', value: 34728928 },
        { description: 'I3. Înființarea și operaționalizarea Centrului Național de Coordonare Velo', value: 1500000 },
        { description: 'I4. Implementarea a 2404 km de piste pentru biciclete', value: 24302153 },
        { description: 'I5. Sporirea accesului la cultură în zonele defavorizate din punct de vedere cultural', value: 7790000 },
        { description: 'I6. Dezvoltarea unui sistem digital pentru procesele de finanțare a culturii', value: 3750000 },
        { description: 'I7. Accelerarea digitalizării producției și distribuției de filme', value: 5460000 }
      ],
      reforms: [
        { description: 'R1. Operaționalizarea organizațiilor de management al destinației (OMD-uri)', value: 10000000 },
        { description: 'R2. Crearea cadrului pentru operaționalizarea traseelor cicloturistice la nivel național', value: 0 },
        { description: 'R3. Reformarea sistemului de finanțare a sectorului cultural', value: 1000000 }
      ]
    },
    'C12': {
      code: 'C12',
      name: 'Sănătate',
      totalValue: 1337325811,
      investments: [
        { description: 'I1. Dezvoltarea infrastructurii medicale prespitalicești  -  I1.1 - Cabinete ale medicilor de familie sau asocieri de cabinete de asistență medicală primară – 2000 unități', value: 120250000 },
        { description: 'I1. Dezvoltarea infrastructurii medicale prespitalicești  - I1.3 – Unități de asistență medicală ambulatorie – 30 unități', value: 80250000 },
        { description: 'I1. Dezvoltarea infrastructurii medicale prespitalicești  - I1.4 – Centre comunitare integrate (nou-construite/renovate și dotate, inclusiv cu personal adecvat) – 200 unități', value: 10854000 },
        { description: 'I1. Dezvoltarea infrastructurii medicale prespitalicești - I1.5 – Cabinete de planificare familială', value: 2016807 },
        { description: 'I2. Dezvoltarea infrastructurii spitalicești publice - I2.1 Dezvoltarea infrastructurii spitalicești publice (19 spitale) si I2.2 Echipamente și aparatură medicală', value: 535436004 },
        { description: 'I2. Dezvoltarea infrastructurii spitalicești publice - I2.3- Dezvoltarea infrastructurii spitalicești publice (25 Unități de terapie intensivă pentru nou-născuți dotate, inclusiv cu ambulanțe pentru nou-născuți (pentru centrele regionale)  (T376)', value: 74026000 },
        { description: 'I2. Dezvoltarea infrastructurii spitalicești publice - I2.4 Echipamente și materiale destinate reducerii riscului de infecții nosocomiale', value: 150380000 },
        { description: 'I4 - Ambulances', value: 183600000 }
      ],
      reforms: [
        { description: 'R1. Dezvoltarea capacității pentru gestionarea fondurilor publice din sănătate', value: 70180000 },
        { description: 'R2. Dezvoltarea capacității de investiții în infrastructura sanitară', value: 30053000 },
        { description: 'R3. Dezvoltarea capacității pentru managementul serviciilor de sănătate și managementul resurselor umane din sănătate', value: 80280000 }
      ]
    },
    'C13': {
      code: 'C13',
      name: 'Reforme sociale',
      totalValue: 169098212,
      investments: [
        { description: 'I1. Crearea unei rețele de centre de zi pentru copiii expuși riscului de a fi separați de familie', value: 48611800 },
        { description: 'I2. Reabilitarea, renovarea și dezvoltarea infrastructurii sociale pentru persoanele cu dizabilități', value: 34032327 },
        { description: 'I3. Operaționalizarea introducerii tichetelor de muncă pentru activitățile casnice', value: 4540000 },
        { description: 'I4. Crearea unei rețele de centre de îngrijire de zi și de reabilitare pentru persoanele în vârstă', value: 77694085 }
      ],
      reforms: [
        { description: 'R1. Crearea unui nou cadru legal pentru a preveni separarea copiilor de familie', value: 0 },
        { description: 'R2. Rsistemului de protecție a persoanelor adulte cu dizabilități', value: 730000 },
        { description: 'R3. Implementarea venitului minim de incluziune (VMI)', value: 2000000 },
        { description: 'R4. Introducerea tichetelor de muncă și formalizarea muncii pentru lucrătorii casnici', value: 0 },
        { description: 'R5. Asigurarea cadrului legal pentru stabilirea salariului minim', value: 0 },
        { description: 'R6. Îmbunătățirea legislației privind economia socială', value: 300000 },
        { description: 'R7. Rserviciilor de îngrijire pe termen lung pentru persoanele în vârstă', value: 1190000 }
      ]
    },
    'C14': {
      code: 'C14',
      name: 'Buna guvernanță',
      totalValue: 77381000,
      investments: [
        { description: 'I 5.  Monitorizarea și implementarea planului', value: 12841000 }
      ],
      reforms: [
        { description: 'R1. Îmbunătățirea predictibilității și a eficienței proceselor decizionale prin întărirea capacității de coordonare a politicilor și analiză de impact la nivelul guvernului și a ministerelor coordonatoare, precum și prin consolidarea instrumentelor în vederea creșterea calității consultărilor publice la toate palierele administrație', value: 11930000 },
        { description: 'R2. Întărirea coordonării la Centrul Guvernului printr-o abordare integrată și coerentă a inițiativelor în domeniul schimbărilor climatice și a dezvoltării durabile', value: 14180000 },
        { description: 'R3. Management performant al resurselor umane în sectorul public', value: 14000000 },
        { description: 'R4. Dezvoltarea unui sistem de salarizare echitabil și unitar în sectorul public', value: 2000000 },
        { description: 'R5. Garantarea independenței justiției, creșterea calității și eficienței acesteia', value: 0 },
        { description: 'R6. Intensificarea luptei împotriva corupției', value: 0 },
        { description: 'R7. Evaluarea și actualizarea legislației privind cadrul de integritate', value: 0 },
        { description: 'R8. Reformarea sistemului național de achiziții publice', value: 4600000 },
        { description: 'R9. Îmbunătățirea cadrului procedural de implementare a principiilor guvernanței corporative în cadrul întreprinderilor de stat', value: 17830000 }
      ]
    },
    'C15': {
      code: 'C15',
      name: 'Educație',
      totalValue: 2792186133,
      investments: [
        { description: 'I1. Construirea, echiparea și operaționalizarea a unui număr de 110 de creșe', value: 230000000 },
        { description: 'I2: Înființarea, echiparea și operaționalizarea unui număr de 90 servicii complementare pentru grupurile dezavantajate', value: 6237500 },
        { description: 'I3.Dezvoltarea programului cadru pentru formarea continuă a profesioniștilor care lucrează în servicii de educație timpurii', value: 3832000 },
        { description: 'I4: Sprijinirea unităților de învățământ cu risc crescut de abandon școlar', value: 460000000 },
        { description: 'I5: Instruiri pentru utilizatorii (SIIIR) și (MATE) și intervenții sistemice pentru reducerea abandonului școlar', value: 43000000 },
        { description: 'I6: Dezvoltarea a 10 consorții regionale și dezvoltarea și dotarea a 10 campusuri profesionale', value: 169000000 },
        { description: 'I8: Program de formare continuă a personalului didactic', value: 80000000 },
        { description: 'I9: Asigurarea echipamentelor și resurselor tehnologice digitale pentru școli', value: 478500000 },
        { description: 'I10: Dezvoltarea rețelei de școli verzi și achiziționarea de microbuze verzi', value: 262105539 },
        { description: 'I11: Asigurarea dotărilor sălilor de clasa și a laboratoarelor/cabinetelor școlare din sistemul preuniversitar', value: 600000000 },
        { description: 'I 13: Echiparea laboratoarelor de informatică din unitățile de învățământ profesional și tehnic', value: 9000000 },
        { description: 'I 14: Echiparea atelierelor de practică din unitățile de învățământ profesional și tehnic', value: 50000000 },
        { description: 'I 16: Digitalizarea universităților și pregătirea acestora pentru profesiile digitale ale viitorului', value: 234000000 },
        { description: 'I 17: Asigurarea infrastructurii universitare (cămine, cantine, spații de recreere)', value: 135791094 },
        { description: 'I 18: Program de instruire și mentorat pentru manageri și inspectori școlari', value: 30720000 }
      ],
      reforms: [
        { description: 'R1. Elaborarea și adoptarea pachetului legislativ pentru implementarea proiectului „România Educată"', value: 0 },
        { description: 'R2. Dezvoltarea unui sistem de servicii de educație timpurie unitar, incluziv și de calitate', value: 0 },
        { description: 'R3. Reforma sistemului de învățământ obligatoriu pentru prevenirea și reducerea părăsirii timpurii a școlii', value: 0 },
        { description: 'R4. Crearea unei rute profesionale complete pentru învățământul tehnic superior', value: 0 },
        { description: 'R5. Adoptarea cadrului legislativ pentru digitalizarea educației', value: 0 },
        { description: 'R6. Actualizarea cadrului legislativ pentru a asigura standarde ecologice de proiectare, construcție și dotare în sistemul de învățământ preuniversitar', value: 0 },
        { description: 'R7. Reforma guvernanței sistemului de învățământ preuniversitar și profesionalizarea managementului', value: 0 }
      ]
    },
    'C16': {
      code: 'C16',
      name: 'RePOWER EU',
      totalValue: 1746184185,
      investments: [
        { description: 'I2. Capacități de producție de energie electrică din surse regenerabile*', value: 460000000 },
        { description: 'I 4. Schemă de acordare a voucherelor pentru accelerarea instalării de capacități de energie regenerabilă în cadrul gospodăriilor individuale', value: 610762268 },
        { description: 'I5. Eficientizarea, modernizarea și digitalizarea rețelei naționale de transport a energiei electrice Subinvestiția 5.a - Instalarea de centrale fotovoltaice (CEF) și instalații de stocare a energiei electrice destinate alimentării serviciilor interne instalate în stațiile C.N.T.E.E. Transelectrica S.A', value: 51788527 },
        { description: 'I 7. Schemă de acordare de vouchere pentru îmbunătățirea eficienței energetice în cadrul gospodăriilor individuale', value: 269690200 },
        { description: 'I8. Contribuția la schema de ajutor de stat sub formă de contracte pentru diferență pentru producerea de energie electrică din surse regenerabile din energie eoliană terestră și energie solară fotovoltaică', value: 350500000 }
      ],
      reforms: [
        { description: 'R1. Crearea unui cadru juridic pentru utilizarea terenurilor aflate în proprietatea statului ca zone de accelerare pentru investițiile în sursele regenerabile de energie', value: 3011752 },
        { description: 'R2. Înființarea de ghișee unice pentru furnizarea către prosumatori de servicii de consiliere în domeniul energiei pentru renovările ce vizează eficiența energetică și producția de energie din surse regenerabile', value: 431438 }
      ]
    }
  }

  const componentsSummary = Object.entries(COMPONENT_MAPPING_PAYMENTS).map(([key, component]) => {
    const data = componentsData[key]
    if (data) {
      return {
        code: data.code,
        name: data.name,
        totalValue: data.totalValue,
        investmentCount: data.investments.length,
        reformCount: data.reforms.length
      }
    }
    // Fallback for components without data
    return {
      code: key,
      name: component.label,
      totalValue: 0,
      investmentCount: 0,
      reformCount: 0
    }
  })

  const detailedComponents = Object.fromEntries(
    Object.entries(componentsData).map(([key, data]) => [key, data])
  )

  const totalValue = componentsSummary.reduce((sum, comp) => sum + comp.totalValue, 0)

  const toggleComponent = (componentCode) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(componentCode)) {
      newExpanded.delete(componentCode)
    } else {
      newExpanded.add(componentCode)
    }
    setExpandedComponents(newExpanded)
  }

  const getComponentColor = (code) => {
    const colors = {
      'C1': '#3b82f6', 'C2': '#10b981', 'C3': '#f59e0b', 'C4': '#ef4444',
      'C5': '#8b5cf6', 'C6': '#06b6d4', 'C7': '#84cc16', 'C8': '#f97316',
      'C9': '#ec4899', 'C10': '#6366f1', 'C11': '#14b8a6', 'C12': '#f43f5e',
      'C13': '#8b5cf6', 'C14': '#64748b', 'C15': '#0ea5e9', 'C16': '#22c55e'
    }
    return colors[code] || '#6b7280'
  }

  const getComponentDetails = (componentCode) => {
    return detailedComponents[componentCode]
  }

  return (
    <>
      <section className="map-container" id="componente-pnrr">
        <div className="components-overview">
          <div className="components-header">
            <h2>Componente PNRR</h2>
            <div className="components-stats">
              <span className="stat">
                <strong>16</strong> componente
              </span>
              <span className="stat">
                <strong>{formatMoney(totalValue)}</strong> valoare totală
              </span>
            </div>
          </div>

        <div className="components-accordion">
          {componentsSummary.map(component => {
            const isExpanded = expandedComponents.has(component.code)
            const details = getComponentDetails(component.code)
            const percentage = ((component.totalValue / totalValue) * 100).toFixed(1)
            
            // Count investments vs reforms
            const investments = details?.investments || []
            const reforms = details?.reforms || []
            
            return (
              <div 
                key={component.code}
                className={`component-accordion-item ${isExpanded ? 'expanded' : ''}`}
                style={{ borderLeftColor: getComponentColor(component.code) }}
              >
                <div 
                  className="component-accordion-header"
                  onClick={() => toggleComponent(component.code)}
                >
                  <div className="component-main-info">
                    <div className="component-code">{component.code}</div>
                    <div className="component-name">{component.name}</div>
                  </div>
                  <div className="component-summary">
                    <div className="component-value">{formatMoney(component.totalValue)}</div>
                    <div className="component-meta">
                      {investments.length} investiții • {reforms.length} reforme • {percentage}% din total
                    </div>
                  </div>
                  <div className="expand-icon">
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>
                  
                  {isExpanded && details && (
                    <div className="component-accordion-content">
                      <div className="investments-header">
                        <h4>Investiții & reforme detaliate</h4>
                        <div className="counters">
                          <span className="investment-count">{investments.length} investiții</span>
                          <span className="reform-count">{reforms.length} reforme</span>
                        </div>
                      </div>
                      
                      {investments.length > 0 && (
                        <div className="section">
                          <h5 className="section-title">Investiții</h5>
                          <div className="investments-list">
                            {investments.map((investment, index) => (
                              <div key={index} className="investment-item">
                                <div className="investment-description">
                                  {investment.description}
                                </div>
                                <div className="investment-value">
                                  {formatMoney(investment.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {reforms.length > 0 && (
                        <div className="section">
                          <h5 className="section-title">Reforme</h5>
                          <div className="investments-list">
                            {reforms.map((reform, index) => (
                              <div key={index} className="investment-item">
                                <div className="investment-description">
                                  {reform.description}
                                </div>
                                <div className="investment-value">
                                  {formatMoney(reform.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </>
  )
}

export default ComponentsOverview

import type { Question } from '../types/question';

export const FALLBACK_QUESTIONS: Question[] = [
  {
    question: "Jaka sila powoduje, ze kropla wody ma ksztalt kulisty?",
    answers: [
      { text: "Napiecie powierzchniowe", correct: true },
      { text: "Sila ciezkosci", correct: false },
      { text: "Sila wyporu", correct: false },
      { text: "Cisnienie atmosferyczne", correct: false }
    ],
    category: "Napiecie powierzchniowe",
    explanation: "*Napiecie powierzchniowe* to zjawisko fizyczne wystepujace na granicy cieczy z gazem. Czasteczki na powierzchni cieczy sa przyciagane tylko od dolu i z bokow (nie ma czasteczek nad nimi), co powoduje, ze powierzchnia zachowuje sie jak napiety blon. {Dzieki temu krople przybieraja ksztalt kulisty - kula ma najmniejsza powierzchnie przy danej objetosci.}",
  },
  {
    question: "Sily spojnosci dzialaja miedzy czasteczkami:",
    answers: [
      { text: "Tej samej substancji", correct: true },
      { text: "Roznych substancji", correct: false },
      { text: "Tylko w cieczach", correct: false },
      { text: "Tylko w gazach", correct: false }
    ],
    category: "Sily spojnosci",
    explanation: "*Sily spojnosci (kohezji)* to sily przyciagania miedzy czasteczkami *tej samej substancji*. Dzieki nim ciala stale zachowuja swoj ksztalt, a ciecze tworza krople. {Przyklad: woda w szklance trzyma sie razem dzieki silom spojnosci miedzy czasteczkami wody.}",
  },
  {
    question: "Sily przylegania (adhezji) odpowiadaja za:",
    answers: [
      { text: "Przyciaganie miedzy czasteczkami roznych substancji", correct: true },
      { text: "Przyciaganie miedzy czasteczkami tej samej substancji", correct: false },
      { text: "Odpychanie czasteczek", correct: false },
      { text: "Ruch Browna", correct: false }
    ],
    category: "Sily przylegania",
    explanation: "*Sily przylegania (adhezji)* dzialaja miedzy czasteczkami *roznych substancji*. {Przyklady: farba przykleja sie do sciany, woda zwilza szklo, klej laczy dwa materialy.} Im silniejsza adhezja, tym lepiej substancje sie lacza.",
  },
  {
    question: "Owad moze chodzic po powierzchni wody dzieki:",
    answers: [
      { text: "Napieciu powierzchniowemu", correct: true },
      { text: "Sile wyporu", correct: false },
      { text: "Malej masie owada", correct: false },
      { text: "Cisnieniu atmosferycznemu", correct: false }
    ],
    category: "Napiecie powierzchniowe",
    explanation: "*Napiecie powierzchniowe* tworzy na powierzchni wody cienka 'blone', ktora moze utrzymac lekkie przedmioty. {Owady wodne (np. nartnik) maja dodatkowo hydrofobowe (odpychajace wode) odnoza, co pomaga im nie przebic tej blony.} Sama mala masa nie wystarczylaby!",
  },
  {
    question: "Jaki wzor opisuje gestosc?",
    answers: [
      { text: "d = m/V", correct: true },
      { text: "d = V/m", correct: false },
      { text: "d = m * V", correct: false },
      { text: "d = F/S", correct: false }
    ],
    category: "Gestosc - wzor",
    explanation: "*Gestosc* (oznaczana grecka litera *ro* - d) to stosunek masy do objetosci: [d = m / V] gdzie: *m* - masa (w kg), *V* - objetosc (w m^3). {Gestosc mowi nam, ile kilogramow substancji miesci sie w jednym metrze szesciennym.}",
  },
  {
    question: "Podstawowa jednostka gestosci w ukladzie SI to:",
    answers: [
      { text: "kg/m^3", correct: true },
      { text: "g/cm^3", correct: false },
      { text: "kg/l", correct: false },
      { text: "g/m^3", correct: false }
    ],
    category: "Gestosc - jednostki",
    explanation: "W ukladzie SI gestosc wyrazamy w *kilogramach na metr szescienny* (kg/m^3). Czesto uzywa sie tez g/cm^3. Wazna zaleznosc: [1 g/cm^3 = 1000 kg/m^3] {Przyklad: gestosc wody to 1 g/cm^3 = 1000 kg/m^3}",
  },
  {
    question: "Kostka o masie 500 g i objetosci 250 cm^3 ma gestosc:",
    answers: [
      { text: "2 g/cm^3", correct: true },
      { text: "0.5 g/cm^3", correct: false },
      { text: "125000 g/cm^3", correct: false },
      { text: "750 g/cm^3", correct: false }
    ],
    category: "Gestosc - obliczenia",
    explanation: "Stosujemy wzor na gestosc: [p = m / V] Podstawiamy wartosci: [p = 500 g / 250 cm^3 = 2 g/cm^3] {Pamietaj: dzielimy mase przez objetosc, nie odwrotnie!}",
  },
  {
    question: "Jesli p = m/V, to masa m wynosi:",
    answers: [
      { text: "m = p * V", correct: true },
      { text: "m = p / V", correct: false },
      { text: "m = V / p", correct: false },
      { text: "m = p + V", correct: false }
    ],
    category: "Gestosc - przeksztalcenie",
    explanation: "Przeksztalcamy wzor p = m/V, aby wyznaczyc mase. Mnozac obie strony przez V: [p * V = m] czyli: [m = p * V] {Masa to iloczyn gestosci i objetosci. Np. jesli p = 2 g/cm^3 i V = 100 cm^3, to m = 2 * 100 = 200 g}",
  },
  {
    question: "Objetosc V ze wzoru na gestosc obliczamy jako:",
    answers: [
      { text: "V = m / p", correct: true },
      { text: "V = m * p", correct: false },
      { text: "V = p / m", correct: false },
      { text: "V = p - m", correct: false }
    ],
    category: "Gestosc - przeksztalcenie",
    explanation: "Z wzoru p = m/V przeksztalcamy, aby wyznaczyc objetosc: [V = m / p] {Objetosc to iloraz masy i gestosci. Np. jesli m = 1000 g i p = 2 g/cm^3, to V = 1000/2 = 500 cm^3}",
  },
  {
    question: "Aby wyznaczyc gestosc szesciannej kostki, nalezy:",
    answers: [
      { text: "Zwazyc kostke i obliczyc jej objetosc z wymiarow", correct: true },
      { text: "Tylko zwazyc kostke", correct: false },
      { text: "Tylko zmierzyc jej wymiary", correct: false },
      { text: "Wlozyc ja do wody", correct: false }
    ],
    category: "Gestosc - przedmioty regularne",
    explanation: "Dla przedmiotow o *regularnym ksztalcie* (szescian, prostopadloscian, kula): 1. Mierzymy wymiary i obliczamy objetosc ze wzorow geometrycznych: [V(szescianu) = a^3] [V(prostopadloscianu) = a * b * c] 2. Wazymy przedmiot (m). 3. Obliczamy gestosc: [p = m / V]",
  },
  {
    question: "Objetosc przedmiotu o nieregularnym ksztalcie najlatwiej zmierzyc:",
    answers: [
      { text: "Zanurzajac go w wodzie i mierzac objetosc wypchietej wody", correct: true },
      { text: "Mierzac jego wymiary linijka", correct: false },
      { text: "Wazac go na wadze", correct: false },
      { text: "Nie da sie jej zmierzyc", correct: false }
    ],
    category: "Gestosc - przedmioty nieregularne",
    explanation: "*Metoda zanurzeniowa (Archimedesa)* pozwala wyznaczyc objetosc przedmiotu o dowolnym ksztalcie: [V(przedmiotu) = V(wypchietej wody)] {Wlewamy wode do cylindra miarowego, odczytujemy poziom V1, zanurzamy przedmiot, odczytujemy V2. Objetosc = V2 - V1}",
  },
  {
    question: "Kamien o masie 150 g zanurzony w wodzie wypchnal 50 cm^3 wody. Jaka jest jego gestosc?",
    answers: [
      { text: "3 g/cm^3", correct: true },
      { text: "7500 g/cm^3", correct: false },
      { text: "0.33 g/cm^3", correct: false },
      { text: "100 g/cm^3", correct: false }
    ],
    category: "Gestosc - przedmioty nieregularne",
    explanation: "Objetosc kamienia = objetosc wypchietej wody = 50 cm^3. Obliczamy gestosc: [p = m / V = 150 g / 50 cm^3 = 3 g/cm^3] {Kamien jest 3 razy gestszy od wody (woda ma 1 g/cm^3).}",
  },
  {
    question: "Cisnienie to:",
    answers: [
      { text: "Sila naciskajaca na jednostke powierzchni", correct: true },
      { text: "Sila dzialajaca na cialo", correct: false },
      { text: "Masa przypadajaca na jednostke objetosci", correct: false },
      { text: "Predkosc czasteczek gazu", correct: false }
    ],
    category: "Cisnienie - definicja",
    explanation: "*Cisnienie* to wielkosc fizyczna okreslajaca sile nacisku przypadajaca na jednostke powierzchni: [p = F / S] {Im wieksza sila F lub mniejsza powierzchnia S, tym wieksze cisnienie. Dlatego noze sa ostre - mala powierzchnia = duze cisnienie!}",
  },
  {
    question: "Wzor na cisnienie to:",
    answers: [
      { text: "p = F/S", correct: true },
      { text: "p = S/F", correct: false },
      { text: "p = F * S", correct: false },
      { text: "p = m/V", correct: false }
    ],
    category: "Cisnienie - wzor",
    explanation: "Wzor na cisnienie: [p = F / S] gdzie: *p* - cisnienie (w Pa), *F* - sila nacisku (w N), *S* - pole powierzchni (w m^2). {Nie myl z gestoscia! p = m/V to gestosc, a p = F/S to cisnienie.}",
  },
  {
    question: "Jednostka cisnienia w ukladzie SI to:",
    answers: [
      { text: "Paskal (Pa)", correct: true },
      { text: "Niuton (N)", correct: false },
      { text: "Metr kwadratowy (m^2)", correct: false },
      { text: "Kilogram (kg)", correct: false }
    ],
    category: "Cisnienie - jednostka",
    explanation: "*Paskal (Pa)* to jednostka cisnienia w ukladzie SI: [1 Pa = 1 N/m^2] Czesto uzywamy tez: [1 hPa (hektopaskal) = 100 Pa] [1 kPa (kilopaskal) = 1000 Pa] {Cisnienie atmosferyczne to okolo 1013 hPa = 101300 Pa}",
  },
  {
    question: "Sila 100 N dziala na powierzchnie 0.5 m^2. Jakie jest cisnienie?",
    answers: [
      { text: "200 Pa", correct: true },
      { text: "50 Pa", correct: false },
      { text: "100.5 Pa", correct: false },
      { text: "0.005 Pa", correct: false }
    ],
    category: "Cisnienie - obliczenia",
    explanation: "Stosujemy wzor na cisnienie: [p = F / S] Podstawiamy: [p = 100 N / 0.5 m^2 = 200 Pa] {Czyli na kazdy metr kwadratowy przypada sila 200 niutonow.}",
  },
  {
    question: "Dlaczego noze sa ostre (maja cienkie ostrze)?",
    answers: [
      { text: "Aby zwiekszac cisnienie przy tej samej sile", correct: true },
      { text: "Aby zmniejszac cisnienie", correct: false },
      { text: "Aby byly lzejsze", correct: false },
      { text: "Dla estetyki", correct: false }
    ],
    category: "Cisnienie - zastosowanie",
    explanation: "Ze wzoru p = F/S wynika: [Mniejsza powierzchnia S = wieksze cisnienie p] {Ostre ostrze ma bardzo mala powierzchnie styku, wiec nawet przy niewielkiej sile nacisku powstaje duze cisnienie, ktore latwo tnie materialy.}",
  },
  {
    question: "Cisnienie atmosferyczne to cisnienie wywierane przez:",
    answers: [
      { text: "Powietrze w atmosferze", correct: true },
      { text: "Wode w oceanie", correct: false },
      { text: "Sile grawitacji", correct: false },
      { text: "Swiatlo sloneczne", correct: false }
    ],
    category: "Cisnienie atmosferyczne",
    explanation: "*Cisnienie atmosferyczne* to nacisk, jaki wywiera slup powietrza na powierzchnie Ziemi. Jest spowodowane *ciezarem powietrza* w atmosferze. {Na poziomie morza nad kazdy 1 m^2 powierzchni naciska okolo 10 ton powietrza!}",
  },
  {
    question: "Normalne cisnienie atmosferyczne na poziomie morza wynosi okolo:",
    answers: [
      { text: "1013 hPa", correct: true },
      { text: "100 hPa", correct: false },
      { text: "10000 hPa", correct: false },
      { text: "1 hPa", correct: false }
    ],
    category: "Cisnienie atmosferyczne",
    explanation: "Normalne cisnienie atmosferyczne wynosi: [p = 1013 hPa = 101300 Pa] {Ta wartosc sluzy jako punkt odniesienia. Prognoza pogody podaje cisnienie w hPa - wysokie cisnienie = ladna pogoda, niskie = deszcz.}",
  },
  {
    question: "Cisnienie atmosferyczne mierzymy za pomoca:",
    answers: [
      { text: "Barometru", correct: true },
      { text: "Termometru", correct: false },
      { text: "Manometru", correct: false },
      { text: "Stetoskopu", correct: false }
    ],
    category: "Cisnienie atmosferyczne",
    explanation: "*Barometr* to przyrzad do pomiaru cisnienia atmosferycznego. {Manometr mierzy cisnienie w zamknietych zbiornikach (np. w oponach), termometr - temperature, a stetoskop sluzy do osluchiwania.}",
  },
  {
    question: "Jak zmienia sie cisnienie atmosferyczne wraz ze wzrostem wysokosci?",
    answers: [
      { text: "Maleje", correct: true },
      { text: "Rosnie", correct: false },
      { text: "Nie zmienia sie", correct: false },
      { text: "Najpierw rosnie, potem maleje", correct: false }
    ],
    category: "Cisnienie atmosferyczne",
    explanation: "Im *wyzej*, tym *mniej powietrza* nad nami, wiec cisnienie *maleje*. {Przyklady: na szczycie Mount Everest (8848 m) cisnienie wynosi tylko okolo 300 hPa - 1/3 normalnego! Dlatego wspinacze uzywaja butli z tlenem.}",
  },
  {
    question: "Prawo Pascala mowi, ze cisnienie wywierane na ciecz:",
    answers: [
      { text: "Rozchodzi sie rowno we wszystkich kierunkach", correct: true },
      { text: "Dziala tylko w dol", correct: false },
      { text: "Dziala tylko do gory", correct: false },
      { text: "Zmniejsza sie z glebokoscia", correct: false }
    ],
    category: "Prawo Pascala",
    explanation: "*Prawo Pascala*: Cisnienie wywierane na ciecz (lub gaz) w zamknietym naczyniu rozchodzi sie *jednakowo we wszystkich kierunkach*. {Jesli nacisniesz w jednym miejscu, cisnienie wzrosnie wszedzie tak samo - jak w balonie z woda.}",
  },
  {
    question: "Ktore urzadzenie wykorzystuje prawo Pascala?",
    answers: [
      { text: "Prasa hydrauliczna", correct: true },
      { text: "Termometr", correct: false },
      { text: "Waga szalkowa", correct: false },
      { text: "Kompas", correct: false }
    ],
    category: "Prawo Pascala",
    explanation: "*Prasa hydrauliczna* wykorzystuje prawo Pascala do zwiekszania sily. Zasada dzialania: [Cisnienie jest takie samo: p = F1/S1 = F2/S2] [Wiec: F2 = F1 * (S2/S1)] {Mala sila na malym tloku wytwarza duza sile na duzym tloku. Stosowane w: podnosznikach samochodowych, hamulcach, koparki.}",
  },
  {
    question: "W prasie hydraulicznej maly tlok ma pole 2 cm^2, duzy 20 cm^2. Jesli na maly tlok dzialamy sila 10 N, to na duzym:",
    answers: [
      { text: "100 N", correct: true },
      { text: "10 N", correct: false },
      { text: "1 N", correct: false },
      { text: "200 N", correct: false }
    ],
    category: "Prawo Pascala",
    explanation: "Cisnienie jest takie samo na obu tlokach: [p = F1/S1 = F2/S2] Przeksztalcamy: [F2 = F1 * (S2/S1)] Podstawiamy: [F2 = 10 N * (20 cm^2 / 2 cm^2) = 10 N * 10 = 100 N] {Sila zostala zwiekszona 10-krotnie! Stosunek sil = stosunek powierzchni.}",
  },
  {
    question: "Wzor na cisnienie hydrostatyczne to:",
    answers: [
      { text: "p = p * g * h", correct: true },
      { text: "p = m * g", correct: false },
      { text: "p = F / S", correct: false },
      { text: "p = m / V", correct: false }
    ],
    category: "Cisnienie hydrostatyczne",
    explanation: "Wzor na *cisnienie hydrostatyczne*: [p = ro * g * h] gdzie: *ro* (p) - gestosc cieczy (kg/m^3), *g* - przyspieszenie grawitacyjne (ok. 10 m/s^2), *h* - glebokosc (m). {Cisnienie rosnie liniowo z glebokoscia!}",
  },
  {
    question: "Cisnienie hydrostatyczne zalezy od:",
    answers: [
      { text: "Glebokosci i gestosci cieczy", correct: true },
      { text: "Ksztaltu naczynia", correct: false },
      { text: "Koloru cieczy", correct: false },
      { text: "Temperatury powietrza", correct: false }
    ],
    category: "Cisnienie hydrostatyczne",
    explanation: "Cisnienie hydrostatyczne zalezy od: [p = ro * g * h] - *glebokosci* (h) - im glebiej, tym wieksze cisnienie, - *gestosci cieczy* (ro) - gestsza ciecz = wieksze cisnienie, - przyspieszenia grawitacyjnego (g). {UWAGA: NIE zalezy od ksztaltu naczynia - to tzw. paradoks hydrostatyczny!}",
  },
  {
    question: "Na jakiej glebokosci w wodzie (p = 1000 kg/m^3) cisnienie hydrostatyczne wynosi 10000 Pa? (g = 10 m/s^2)",
    answers: [
      { text: "1 m", correct: true },
      { text: "10 m", correct: false },
      { text: "100 m", correct: false },
      { text: "0.1 m", correct: false }
    ],
    category: "Cisnienie hydrostatyczne",
    explanation: "Z wzoru p = ro * g * h wyznaczamy glebokosc: [h = p / (ro * g)] Podstawiamy: [h = 10000 Pa / (1000 kg/m^3 * 10 m/s^2)] [h = 10000 / 10000 = 1 m] {Na kazdym metrze glebokosci w wodzie cisnienie rosnie o 10000 Pa!}",
  },
  {
    question: "Dlaczego tamy sa grubsze u podstawy?",
    answers: [
      { text: "Bo cisnienie hydrostatyczne rosnie z glebokoscia", correct: true },
      { text: "Dla lepszego wygladu", correct: false },
      { text: "Bo woda jest ciezsza na dole", correct: false },
      { text: "Ze wzgledu na temperature", correct: false }
    ],
    category: "Cisnienie hydrostatyczne",
    explanation: "Ze wzoru p = ro * g * h wynika, ze *im glebiej, tym wieksze cisnienie*. {U podstawy tamy cisnienie moze byc ogromne (np. na 100 m glebokosci to 1 000 000 Pa = 10 atmosfer!), dlatego tama musi byc tam najgrubsza, zeby wytrzymac ten nacisk.}",
  },
  {
    question: "Cialo plynie w cieczy, gdy jego gestosc jest:",
    answers: [
      { text: "Mniejsza od gestosci cieczy", correct: true },
      { text: "Wieksza od gestosci cieczy", correct: false },
      { text: "Rowna gestosci cieczy", correct: false },
      { text: "Gestosc nie ma znaczenia", correct: false }
    ],
    category: "Plywanie cial",
    explanation: "Warunki plywania cial: [ro(ciala) < ro(cieczy) => cialo PLYNIE] [ro(ciala) > ro(cieczy) => cialo TONIE] [ro(ciala) = ro(cieczy) => cialo ZAWISA] {Przyklad: drewno (600 kg/m^3) < woda (1000 kg/m^3), wiec drewno plynie.}",
  },
  {
    question: "Cialo tonie w cieczy, gdy:",
    answers: [
      { text: "Gestosc ciala > gestosc cieczy", correct: true },
      { text: "Gestosc ciala < gestosc cieczy", correct: false },
      { text: "Gestosc ciala = gestosc cieczy", correct: false },
      { text: "Cialo jest duze", correct: false }
    ],
    category: "Plywanie cial",
    explanation: "Cialo tonie, gdy: [ro(ciala) > ro(cieczy)] Wtedy sila wyporu jest *mniejsza* od ciezaru ciala. {Przyklad: zelazo (7800 kg/m^3) > woda (1000 kg/m^3), wiec zelazo tonie w wodzie. Ale plynie w rteci (13600 kg/m^3)!}",
  },
  {
    question: "Drewno (p = 600 kg/m^3) wrzucone do wody (p = 1000 kg/m^3):",
    answers: [
      { text: "Bedzie plywac", correct: true },
      { text: "Zatonie", correct: false },
      { text: "Pozostanie w srodku", correct: false },
      { text: "Rozpusci sie", correct: false }
    ],
    category: "Plywanie cial",
    explanation: "Porownujemy gestosci: [ro(drewna) = 600 kg/m^3] [ro(wody) = 1000 kg/m^3] [600 < 1000, wiec drewno PLYNIE] {Drewno zanurzza sie tylko na 60% (600/1000), bo musi wypchac tyle wody, ile samo wazy.}",
  },
  {
    question: "Zelazna kulka (p = 7800 kg/m^3) w rteci (p = 13600 kg/m^3):",
    answers: [
      { text: "Bedzie plywac", correct: true },
      { text: "Zatonie", correct: false },
      { text: "Zawisnie w srodku", correct: false },
      { text: "Wyparuje", correct: false }
    ],
    category: "Plywanie cial",
    explanation: "Choc zelazo jest ciezkie, rtec jest jeszcze gestsza! [ro(zelaza) = 7800 kg/m^3] [ro(rteci) = 13600 kg/m^3] [7800 < 13600, wiec zelazo PLYNIE na rteci!] {To dlatego rtec byla uzywana w starych termometrach - jest bardzo gesta.}",
  },
  {
    question: "Sila wyporu dziala na cialo zanurzone w cieczy:",
    answers: [
      { text: "Pionowo do gory", correct: true },
      { text: "Pionowo w dol", correct: false },
      { text: "Poziomo", correct: false },
      { text: "W dowolnym kierunku", correct: false }
    ],
    category: "Sila wyporu",
    explanation: "*Sila wyporu* zawsze dziala *pionowo do gory*. Jest wynikiem roznicy cisnien hydrostatycznych na dolna i gorna powierzchnie zanurzonego ciala. {Na dolna czesc ciala dziala wieksze cisnienie (bo jest glebiej), co 'wypycha' cialo do gory.}",
  },
  {
    question: "Od czego zalezy sila wyporu?",
    answers: [
      { text: "Od objetosci zanurzonej czesci ciala i gestosci cieczy", correct: true },
      { text: "Tylko od masy ciala", correct: false },
      { text: "Tylko od ksztaltu ciala", correct: false },
      { text: "Od koloru ciala", correct: false }
    ],
    category: "Sila wyporu",
    explanation: "Sila wyporu zalezy od: [Fw = ro(cieczy) * V * g] - *gestosci cieczy* (ro) - gestsza ciecz = wieksza sila wyporu, - *objetosci zanurzonej czesci* (V), - przyspieszenia grawitacyjnego (g). {NIE zalezy od masy ani gestosci zanurzonego ciala!}",
  },
  {
    question: "Dlaczego w wodzie czujemy sie lzejsi?",
    answers: [
      { text: "Bo sila wyporu dziala przeciwnie do ciezaru", correct: true },
      { text: "Bo woda nas rozpuszcza", correct: false },
      { text: "Bo zmniejsza sie nasza masa", correct: false },
      { text: "Bo zmienia sie przyspieszenie grawitacyjne", correct: false }
    ],
    category: "Sila wyporu",
    explanation: "W wodzie dzialaja na nas dwie sily: [Ciezar (w dol): Fc = m * g] [Sila wyporu (w gore): Fw = ro * V * g] Wypadkowa tych sil jest mniejsza niz sam ciezar: [F(wypadkowa) = Fc - Fw] {Dlatego czujemy sie lzejsi - sila wyporu 'odciaaza' nas czesciowo.}",
  },
  {
    question: "Prawo Archimedesa mowi, ze sila wyporu rowna jest:",
    answers: [
      { text: "Ciezarowi wypchietej cieczy", correct: true },
      { text: "Masie ciala", correct: false },
      { text: "Objetosci ciala", correct: false },
      { text: "Cisnieniu hydrostatycznemu", correct: false }
    ],
    category: "Prawo Archimedesa",
    explanation: "*Prawo Archimedesa*: Na cialo zanurzone w cieczy (lub gazie) dziala sila wyporu rowna *ciezarowi wypchnietej cieczy*. [Fw = m(wypchnietej cieczy) * g] [Fw = ro(cieczy) * V(zanurzone) * g] {To dlatego statki plywaja - wypychaja ogromne ilosci wody!}",
  },
  {
    question: "Wzor na sile wyporu to:",
    answers: [
      { text: "Fw = pc * V * g", correct: true },
      { text: "Fw = m * g", correct: false },
      { text: "Fw = p * g * h", correct: false },
      { text: "Fw = F / S", correct: false }
    ],
    category: "Prawo Archimedesa",
    explanation: "Wzor na *sile wyporu*: [Fw = ro(cieczy) * V * g] gdzie: *ro(cieczy)* - gestosc cieczy (kg/m^3), *V* - objetosc zanurzonej czesci (m^3), *g* - przyspieszenie (ok. 10 m/s^2). {Wynik otrzymujemy w niutonach (N).}",
  },
  {
    question: "Cialo o objetosci 0.01 m^3 zanurzono w wodzie (p = 1000 kg/m^3). Sila wyporu wynosi (g = 10 m/s^2):",
    answers: [
      { text: "100 N", correct: true },
      { text: "10 N", correct: false },
      { text: "1000 N", correct: false },
      { text: "1 N", correct: false }
    ],
    category: "Prawo Archimedesa",
    explanation: "Stosujemy wzor na sile wyporu: [Fw = ro * V * g] Podstawiamy: [Fw = 1000 kg/m^3 * 0.01 m^3 * 10 m/s^2] [Fw = 100 N] {Sila 100 N to mniej wiecej ciezar 10 kg masy.}",
  },
  {
    question: "Archimedes odkryl swoje prawo badajac:",
    answers: [
      { text: "Czy korona krola jest ze zlota", correct: true },
      { text: "Gestosc powietrza", correct: false },
      { text: "Cisnienie atmosferyczne", correct: false },
      { text: "Napiecie powierzchniowe", correct: false }
    ],
    category: "Prawo Archimedesa",
    explanation: "Wedlug legendy, krol Hieron II poprosil Archimedesa o sprawdzenie, czy jego korona jest z czystego zlota. {Archimedes wpadl na pomysl w kapieli - zauwazyl, ze poziom wody podnosi sie, gdy wchodzi do wanny. Wykrzyknal slynne 'Eureka!' (Znalazlem!).}",
  },
  {
    question: "Ile cyfr znaczacych ma liczba 0.00340?",
    answers: [
      { text: "3", correct: true },
      { text: "5", correct: false },
      { text: "6", correct: false },
      { text: "2", correct: false }
    ],
    category: "Cyfry znaczace",
    explanation: "Zasady liczenia *cyfr znaczacych*: - Zera na poczatku NIE sa znaczace (tylko okreslaja rzad wielkosci), - Zera miedzy cyframi SA znaczace, - Zera na koncu po przecinku SA znaczace. [0.00340 => cyfry znaczace: 3, 4, 0 => 3 cyfry] {Zero na koncu jest znaczace, bo zostalo celowo zapisane!}",
  },
  {
    question: "Liczba 2.50 ma:",
    answers: [
      { text: "3 cyfry znaczace", correct: true },
      { text: "2 cyfry znaczace", correct: false },
      { text: "1 cyfre znaczaca", correct: false },
      { text: "4 cyfry znaczace", correct: false }
    ],
    category: "Cyfry znaczace",
    explanation: "Liczba *2.50* ma 3 cyfry znaczace: [Cyfry: 2, 5, 0] Zero na koncu po przecinku jest *znaczace* - oznacza, ze pomiar byl dokladny do setnych. {Gdyby zapisac 2.5, mielibysmy tylko 2 cyfry znaczace.}",
  },
  {
    question: "Wynik 3.14159 zaokraglony do 3 cyfr znaczacych to:",
    answers: [
      { text: "3.14", correct: true },
      { text: "3.15", correct: false },
      { text: "3.1", correct: false },
      { text: "3.142", correct: false }
    ],
    category: "Cyfry znaczace",
    explanation: "Zaokraglanie do 3 cyfr znaczacych: [3.14159] Bierzemy 3 pierwsze cyfry znaczace: 3, 1, 4. Patrzymy na czwarta cyfre (1) - jest < 5, wiec zaokraglamy *w dol*: [Wynik: 3.14] {Gdyby czwarta cyfra byla >= 5, zaokraglilibysmy w gore.}",
  },
  {
    question: "Liczba 4500 zapisana z 2 cyframi znaczacymi to:",
    answers: [
      { text: "4.5 * 10^3", correct: true },
      { text: "45 * 10^2", correct: false },
      { text: "4500", correct: false },
      { text: "4.500 * 10^3", correct: false }
    ],
    category: "Cyfry znaczace",
    explanation: "Problem: w liczbie 4500 nie wiadomo, czy zera sa znaczace czy nie. *Notacja wykladnicza* rozwiazuje ten problem: [4500 z 2 cyframi znaczacymi = 4.5 * 10^3] [4500 z 3 cyframi znaczacymi = 4.50 * 10^3] [4500 z 4 cyframi znaczacymi = 4.500 * 10^3]",
  },
  {
    question: "1 m^2 to:",
    answers: [
      { text: "10000 cm^2", correct: true },
      { text: "100 cm^2", correct: false },
      { text: "1000 cm^2", correct: false },
      { text: "1000000 cm^2", correct: false }
    ],
    category: "Jednostki - powierzchnia",
    explanation: "Zamiana jednostek *powierzchni*: [1 m = 100 cm] Podnosimy do kwadratu: [1 m^2 = (100 cm)^2 = 100 * 100 cm^2 = 10000 cm^2] {Pamietaj: przy jednostkach kwadratowych mnozymy razy 100 DWA razy!}",
  },
  {
    question: "1 m^3 to:",
    answers: [
      { text: "1000000 cm^3", correct: true },
      { text: "1000 cm^3", correct: false },
      { text: "100 cm^3", correct: false },
      { text: "10000 cm^3", correct: false }
    ],
    category: "Jednostki - objetosc",
    explanation: "Zamiana jednostek *objetosci*: [1 m = 100 cm] Podnosimy do szescianu: [1 m^3 = (100 cm)^3 = 100 * 100 * 100 cm^3 = 1000000 cm^3] {To milion centymetrow szesciennych! Przy objetosci mnozymy razy 100 TRZY razy.}",
  },
  {
    question: "1 kPa (kilopaskal) to:",
    answers: [
      { text: "1000 Pa", correct: true },
      { text: "100 Pa", correct: false },
      { text: "10 Pa", correct: false },
      { text: "0.001 Pa", correct: false }
    ],
    category: "Jednostki - cisnienie",
    explanation: "Przedrostki w ukladzie SI: [kilo (k) = 1000] [hekto (h) = 100] [deka (da) = 10] Wiec: [1 kPa = 1000 Pa] {Pamietaj: 'kilo' zawsze oznacza tysiackrotnosc, jak w 'kilogram' = 1000 gramow.}",
  },
  {
    question: "1 hPa (hektopaskal) to:",
    answers: [
      { text: "100 Pa", correct: true },
      { text: "1000 Pa", correct: false },
      { text: "10 Pa", correct: false },
      { text: "0.01 Pa", correct: false }
    ],
    category: "Jednostki - cisnienie",
    explanation: "Przedrostek *hekto* oznacza 100: [1 hPa = 100 Pa] {Hektopaskale sa uzywane w meteorologii. Normalne cisnienie atmosferyczne to 1013 hPa = 101300 Pa.}",
  },
  {
    question: "1 litr to:",
    answers: [
      { text: "1000 cm^3", correct: true },
      { text: "100 cm^3", correct: false },
      { text: "1 cm^3", correct: false },
      { text: "10000 cm^3", correct: false }
    ],
    category: "Jednostki - objetosc",
    explanation: "Wazna zaleznosc: [1 litr = 1 dm^3 = 1000 cm^3 = 0.001 m^3] {Przydatne do obliczen z gestoscia: woda ma gestosc 1 g/cm^3, czyli 1 litr wody wazy 1 kg (1000 g).}",
  },
  {
    question: "1 g/cm^3 to:",
    answers: [
      { text: "1000 kg/m^3", correct: true },
      { text: "1 kg/m^3", correct: false },
      { text: "0.001 kg/m^3", correct: false },
      { text: "100 kg/m^3", correct: false }
    ],
    category: "Jednostki - gestosc",
    explanation: "Zamiana jednostek gestosci: [1 g/cm^3 = ?] [1 g = 0.001 kg] [1 cm^3 = 0.000001 m^3] [1 g/cm^3 = 0.001 kg / 0.000001 m^3 = 1000 kg/m^3] {Gestosc wody: 1 g/cm^3 = 1000 kg/m^3}",
  },
  {
    question: "500 cm^2 to ile m^2?",
    answers: [
      { text: "0.05 m^2", correct: true },
      { text: "5 m^2", correct: false },
      { text: "0.005 m^2", correct: false },
      { text: "0.5 m^2", correct: false }
    ],
    category: "Jednostki - powierzchnia",
    explanation: "Wiemy, ze: [1 m^2 = 10000 cm^2] Wiec: [500 cm^2 = 500 / 10000 m^2 = 0.05 m^2] {Przy zamianie z cm^2 na m^2 dzielimy przez 10000.}",
  },
  {
    question: "Gestosc wody wynosi 1000 kg/m^3. Co to oznacza?",
    answers: [
      { text: "1 metr szescienny wody ma mase 1000 kg", correct: true },
      { text: "1 kg wody zajmuje 1000 m^3", correct: false },
      { text: "Woda wywiera cisnienie 1000 Pa", correct: false },
      { text: "Woda plynie z predkoscia 1000 m/s", correct: false }
    ],
    category: "Gestosc",
    explanation: "Gestosc *1000 kg/m^3* oznacza: [Na kazdy 1 m^3 objetosci przypada 1000 kg masy] {Czyli 1 metr szescienny wody wazy 1000 kg = 1 tone! To sporo - szescienna wanna o boku 1 m wazylaby tone.}",
  },
  {
    question: "Dlaczego gasienice czolgu sa szerokie?",
    answers: [
      { text: "Aby zmniejszyc cisnienie na grunt", correct: true },
      { text: "Aby zwiekszyc cisnienie na grunt", correct: false },
      { text: "Dla lepszego wygladu", correct: false },
      { text: "Aby czolg byl szybszy", correct: false }
    ],
    category: "Cisnienie",
    explanation: "Ze wzoru p = F/S: [Wieksza powierzchnia S = mniejsze cisnienie p] Szerokie gasienice *rozkladaja ciezar* czolgu na duza powierzchnie: {Czolg wazy ~60 ton, ale dzieki szerokim gasienicom wywiera cisnienie mniejsze niz czlowiek stojacy na jednej nodze! Dzieki temu nie grzeznie w blocie.}",
  },
  {
    question: "Statek ze stali plynie, bo:",
    answers: [
      { text: "Ma duza objetosc (jest pusty w srodku)", correct: true },
      { text: "Stal jest lzejsza od wody", correct: false },
      { text: "Woda w morzu jest slona", correct: false },
      { text: "Statek ma silniki", correct: false }
    ],
    category: "Prawo Archimedesa",
    explanation: "Choc stal jest gestsza od wody (7800 > 1000 kg/m^3), statek plynie dzieki *pustej przestrzeni wewnatrz*: [Srednia gestosc statku (stal + powietrze) < gestosc wody] {Statek wypycha ogromna objetosc wody, wiec sila wyporu jest bardzo duza - wystarczajaca do utrzymania ciezaru statku.}",
  },
  {
    question: "Nurek na glebokosci 10 m w wodzie odczuwa dodatkowe cisnienie okolo:",
    answers: [
      { text: "100 000 Pa (1 atmosfery)", correct: true },
      { text: "10 000 Pa", correct: false },
      { text: "1 000 Pa", correct: false },
      { text: "10 Pa", correct: false }
    ],
    category: "Cisnienie hydrostatyczne",
    explanation: "Obliczamy cisnienie hydrostatyczne na 10 m: [p = ro * g * h] [p = 1000 kg/m^3 * 10 m/s^2 * 10 m] [p = 100 000 Pa = 100 kPa] {To odpowiada okolo 1 atmosferze! Na 10 m nurek odczuwa 2 atmosfery (1 atm. powietrza + 1 atm. wody).}",
  },
  {
    question: "Mydlo zmniejsza napiecie powierzchniowe wody. Dzieki temu:",
    answers: [
      { text: "Woda lepiej zwilza powierzchnie i lepiej pierze", correct: true },
      { text: "Woda staje sie gestsza", correct: false },
      { text: "Woda paruje wolniej", correct: false },
      { text: "Woda zamarza w wyzszej temperaturze", correct: false }
    ],
    category: "Napiecie powierzchniowe",
    explanation: "Mydlo to *surfaktant* - zmniejsza napiecie powierzchniowe wody. Efekty: - Woda latwiej *zwilza* powierzchnie (wnika w tkaniny), - Lepiej *rozpuszcza* tluszcze, - Tworzy *piane* (banki mydlane!). {Dlatego pierzemy z mydlem lub proszkiem - czysta woda slabo zwilza tkaniny.}",
  },
  {
    question: "Gestosc wody wynosi 1000 kg/m^3.",
    answers: [
      { text: "Prawda", correct: true },
      { text: "Falsz", correct: false }
    ],
    category: "Gestosc",
    explanation: "*Prawda!* Gestosc wody wynosi dokladnie 1000 kg/m^3 (lub 1 g/cm^3). To wazna wartosc referencyjna w fizyce.",
    type: "true-false",
  },
  {
    question: "Im wieksza powierzchnia, tym wieksze cisnienie przy tej samej sile.",
    answers: [
      { text: "Prawda", correct: false },
      { text: "Falsz", correct: true }
    ],
    category: "Cisnienie",
    explanation: "*Falsz!* Ze wzoru p = F/S wynika, ze im WIEKSZA powierzchnia, tym MNIEJSZE cisnienie. Dlatego noze sa ostre - mala powierzchnia = duze cisnienie.",
    type: "true-false",
  },
  {
    question: "Sila wyporu zalezy od gestosci zanurzonego ciala.",
    answers: [
      { text: "Prawda", correct: false },
      { text: "Falsz", correct: true }
    ],
    category: "Prawo Archimedesa",
    explanation: "*Falsz!* Sila wyporu (Fw = ro*V*g) zalezy od gestosci CIECZY, objetosci zanurzonej czesci i przyspieszenia grawitacyjnego. NIE zalezy od gestosci ciala!",
    type: "true-false",
  },
  {
    question: "Cisnienie atmosferyczne maleje wraz ze wzrostem wysokosci.",
    answers: [
      { text: "Prawda", correct: true },
      { text: "Falsz", correct: false }
    ],
    category: "Cisnienie atmosferyczne",
    explanation: "*Prawda!* Im wyzej, tym mniej powietrza nad nami, wiec cisnienie maleje. Na Mount Everest cisnienie to tylko okolo 1/3 normalnego.",
    type: "true-false",
  },
  {
    question: "Drewno tonie w wodzie.",
    answers: [
      { text: "Prawda", correct: false },
      { text: "Falsz", correct: true }
    ],
    category: "Plywanie cial",
    explanation: "*Falsz!* Drewno ma gestosc okolo 600 kg/m^3, co jest mniejsze niz gestosc wody (1000 kg/m^3), wiec drewno plynie.",
    type: "true-false",
  },
  {
    question: "Prawo Pascala mowi, ze cisnienie w cieczy rozchodzi sie rowno we wszystkich kierunkach.",
    answers: [
      { text: "Prawda", correct: true },
      { text: "Falsz", correct: false }
    ],
    category: "Prawo Pascala",
    explanation: "*Prawda!* Prawo Pascala: Cisnienie wywierane na ciecz w zamknietym naczyniu rozchodzi sie jednakowo we wszystkich kierunkach.",
    type: "true-false",
  },
  {
    question: "1 hPa to 1000 Pa.",
    answers: [
      { text: "Prawda", correct: false },
      { text: "Falsz", correct: true }
    ],
    category: "Jednostki",
    explanation: "*Falsz!* 1 hPa (hektopaskal) = 100 Pa. Przedrostek 'hekto' oznacza 100, nie 1000. 1000 Pa to 1 kPa (kilopaskal).",
    type: "true-false",
  },
  {
    question: "Sila wyporu dziala pionowo do gory.",
    answers: [
      { text: "Prawda", correct: true },
      { text: "Falsz", correct: false }
    ],
    category: "Sila wyporu",
    explanation: "*Prawda!* Sila wyporu zawsze dziala pionowo do gory, przeciwnie do sily ciezkosci.",
    type: "true-false",
  },
  {
    question: "Owady moga chodzic po wodzie dzieki sile wyporu.",
    answers: [
      { text: "Prawda", correct: false },
      { text: "Falsz", correct: true }
    ],
    category: "Napiecie powierzchniowe",
    explanation: "*Falsz!* Owady chodza po wodzie dzieki NAPIECIU POWIERZCHNIOWEMU, ktore tworzy na powierzchni wody elastyczna 'blone'.",
    type: "true-false",
  },
  {
    question: "Zelazo plynie na rteci.",
    answers: [
      { text: "Prawda", correct: true },
      { text: "Falsz", correct: false }
    ],
    category: "Gestosc",
    explanation: "*Prawda!* Gestosc zelaza (7800 kg/m^3) jest mniejsza niz gestosc rteci (13600 kg/m^3), wiec zelazo plynie na rteci!",
    type: "true-false",
  }
];

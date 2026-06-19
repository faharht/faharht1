// Tiny i18n: typed string dictionary keyed by an id. No external library.
// To add a key: declare it on `Strings` and set `en`, `pl`, `de` values.

export type Locale = "en" | "pl" | "de";

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "pl", label: "Polski", flag: "🇵🇱" },
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const STRINGS = {
  // Nav
  "nav.home":               { en: "Home",                                  pl: "Start", de: "Home" },
  "nav.profile":            { en: "Profile",                               pl: "Profil", de: "Profil" },

  // Common
  "common.back":            { en: "Back",                                  pl: "Wstecz", de: "Zurück" },
  "common.close":           { en: "Close",                                 pl: "Zamknij", de: "Schließen" },
  "common.cancel":          { en: "Cancel",                                pl: "Anuluj", de: "Abbrechen" },
  "common.today":           { en: "Today",                                 pl: "Dziś", de: "Heute" },
  "common.locked":          { en: "Locked",                                pl: "Zablokowane", de: "Gesperrt" },
  "common.tryAgain":        { en: "Try again",                             pl: "Spróbuj ponownie", de: "Erneut versuchen" },
  "common.goHome":          { en: "Go home",                               pl: "Wróć do startu", de: "Zum Home-Bildschirm" },
  "common.pleaseWait":      { en: "Please wait…",                          pl: "Proszę czekać…", de: "Bitte warten…" },

  // 404 / error
  "err.404Title":           { en: "Page not found",                        pl: "Nie znaleziono strony", de: "Seite nicht gefunden" },
  "err.404Desc":            { en: "The page you're looking for doesn't exist or has been moved.", pl: "Strona, której szukasz, nie istnieje lub została przeniesiona.", de: "Die gesuchte Seite existiert nicht oder wurde verschoben." },
  "err.bootTitle":          { en: "This page didn't load",                 pl: "Strona się nie wczytała", de: "Seite konnte nicht geladen werden" },
  "err.bootDesc":           { en: "Something went wrong on our end. You can try refreshing or head back home.", pl: "Coś poszło nie tak. Spróbuj odświeżyć stronę lub wrócić do startu.", de: "Etwas ist schiefgelaufen. Versuche die Seite neu zu laden oder kehre zum Home-Bildschirm zurück." },

  // Home
  "home.title":             { en: "Russian Master",                        pl: "Mistrz Rosyjskiego", de: "Russisch-Meister" },
  "home.tagline":           { en: "A1 → B2 sentence trainer",              pl: "Trener zdań A1 → B2", de: "A1 → B2 Satz-Trainer" },
  "home.intro":             { en: "Pick a level and a part to start practicing. Tap a sentence for audio and stress marks.", pl: "Wybierz poziom i część, aby zacząć ćwiczyć. Dotknij zdania, aby usłyszeć je i zobaczyć akcenty.", de: "Wähle ein Level und einen Teil aus, um zu üben. Tippe auf einen Satz für Audio und Betonungszeichen." },
  "home.categories":        { en: "categories",                            pl: "kategorie", de: "Kategorien" },
  "home.browseLists":       { en: "Browse lists →",                        pl: "Przeglądaj listy →", de: "Listen durchsuchen →" },
  "band.Beginner":          { en: "Beginner",                              pl: "Początkujący", de: "Anfänger" },
  "band.Intermediate":      { en: "Intermediate",                          pl: "Średnio zaawansowany", de: "Fortgeschritten" },

  // Level descriptions
  "level.A1.desc":          { en: "Fundamental words and phrases for navigating simple, everyday situations.", pl: "Podstawowe słowa i zwroty do prostych, codziennych sytuacji.", de: "Grundlegende Wörter und Sätze für einfache Alltagssituationen." },
  "level.A2.desc":          { en: "Essential vocabulary for describing your environment, routine, and recent past.", pl: "Niezbędne słownictwo do opisu otoczenia, codziennej rutyny i niedawnej przeszłości.", de: "Wichtiger Wortschatz zur Beschreibung deiner Umgebung, Routine und jüngsten Vergangenheit." },
  "level.B1.desc":          { en: "Functional language to express opinions, explain plans, and handle most situations.", pl: "Praktyczny język do wyrażania opinii, omawiania planów i radzenia sobie w większości sytuacji.", de: "Funktionale Sprache, um Meinungen zu äußern, Pläne zu erklären und die meisten Situationen zu meistern." },
  "level.B2.desc":          { en: "Versatile vocabulary for engaging in complex discussions and expressing views.", pl: "Wszechstronne słownictwo do prowadzenia złożonych rozmów i wyrażania poglądów.", de: "Vielseitiger Wortschatz für komplexe Diskussionen und zum Ausdrücken von Ansichten." },

  // Part themes (A1)
  "part.A1.1":              { en: "Greetings, pronouns, simple states",    pl: "Powitania, zaimki, proste stany", de: "Begrüßungen, Pronomen, einfache Zustände" },
  "part.A1.2":              { en: "Family, numbers, colors, days",         pl: "Rodzina, liczby, kolory, dni", de: "Familie, Zahlen, Farben, Tage" },
  "part.A1.3":              { en: "Common verbs in the present",           pl: "Często używane czasowniki w czasie teraźniejszym", de: "Häufige Verben im Präsens" },
  "part.A1.4":              { en: "Places, directions, basic questions",   pl: "Miejsca, kierunki, podstawowe pytania", de: "Orte, Wegbeschreibungen, grundlegende Fragen" },
  // A2
  "part.A2.1":              { en: "Daily routine and past tense",          pl: "Codzienna rutyna i czas przeszły", de: "Tagesablauf und Vergangenheitsform" },
  "part.A2.2":              { en: "Food, ordering, modal verbs",           pl: "Jedzenie, zamawianie, czasowniki modalne", de: "Essen, Bestellen, Modalverben" },
  "part.A2.3":              { en: "Travel, transport, future plans",       pl: "Podróże, transport, plany na przyszłość", de: "Reisen, Transport, Zukunftspläne" },
  "part.A2.4":              { en: "Weather, clothing, feelings",           pl: "Pogoda, ubrania, uczucia", de: "Wetter, Kleidung, Gefühle" },
  // B1
  "part.B1.1":              { en: "Opinions, feelings, complex thoughts",  pl: "Opinie, uczucia, złożone myśli", de: "Meinungen, Gefühle, komplexe Gedanken" },
  "part.B1.2":              { en: "Work, study, conditionals",             pl: "Praca, nauka, tryb warunkowy", de: "Arbeit, Studium, Konditionalsätze" },
  "part.B1.3":              { en: "Health, body, reflexives",              pl: "Zdrowie, ciało, czasowniki zwrotne", de: "Gesundheit, Körper, Reflexivverben" },
  "part.B1.4":              { en: "City life, comparisons, culture",       pl: "Życie w mieście, porównania, kultura", de: "Stadtleben, Vergleiche, Kultur" },
  // B2
  "part.B2.1":              { en: "Society, participles, gerunds",         pl: "Społeczeństwo, imiesłowy", de: "Gesellschaft, Partizipien, Gerundien" },
  "part.B2.2":              { en: "News, environment, formal speech",      pl: "Wiadomości, środowisko, mowa formalna", de: "Nachrichten, Umwelt, formelle Sprache" },
  "part.B2.3":              { en: "Idioms and colloquial expressions",     pl: "Idiomy i zwroty potoczne", de: "Idiome und umgangssprachliche Ausdrücke" },
  "part.B2.4":              { en: "Literature, narrative, indirect speech", pl: "Literatura, narracja, mowa zależna", de: "Literatur, Erzählung, indirekte Rede" },

  // Level list title pattern (uses {level} {part})
  "list.levelPartTitle":    { en: "{level} Level — Part {part}",           pl: "Poziom {level} — Część {part}", de: "{level} Level — Teil {part}" },

  // Extras
  "extra.basicVerb.title":  { en: "Basic Verb Conjugations",               pl: "Podstawowa koniugacja czasowników", de: "Grundlegende Verbkonjugationen" },
  "extra.basicVerb.desc":   { en: "Present · Past · Future",               pl: "Teraźniejszy · Przeszły · Przyszły", de: "Präsens · Präteritum · Futur" },
  "extra.adj.title":        { en: "300 Most Common Adjectives",            pl: "300 najczęstszych przymiotników", de: "300 häufigste Adjektive" },
  "extra.adj.desc":         { en: "Essential descriptors to add detail and variety to your daily language.", pl: "Najważniejsze określenia, by wzbogacić codzienny język.", de: "Wichtige Deskriptoren für mehr Details und Abwechslung im Alltag." },
  "extra.adv.title":        { en: "300 Most Common Adverbs",               pl: "300 najczęstszych przysłówków", de: "300 häufigste Adverbien" },
  "extra.adv.desc":         { en: "Key modifiers to express how, when, and where actions take place.", pl: "Kluczowe wyrazy do wyrażania jak, kiedy i gdzie odbywają się czynności.", de: "Wichtige Modifikatoren für das Wie, Wann und Wo von Handlungen." },
  "extra.verb.title":       { en: "300 Most Common Verbs",                 pl: "300 najczęstszych czasowników", de: "300 häufigste Verben" },
  "extra.verb.desc":        { en: "Essential action words to describe activities and states of being.", pl: "Najważniejsze czasowniki do opisu czynności i stanów.", de: "Wichtige Tätigkeitswörter für Aktivitäten und Zustände." },

  // List page header / stats
  "list.vocabulary":        { en: "Vocabulary",                            pl: "Słownictwo", de: "Vokabeln" },
  "list.stat.practiced":    { en: "PRACTICED",                             pl: "ĆWICZONE", de: "GEÜBT" },
  "list.stat.reps":         { en: "REPS",                                  pl: "POWTÓRZENIA", de: "WDHL." },
  "list.stat.mastered":     { en: "MASTERED",                              pl: "OPANOWANE", de: "GEMEISTERT" },
  // Play bar
  "list.play":              { en: "Play all",                              pl: "Odtwórz wszystko", de: "Alle abspielen" },
  "list.stop":              { en: "Stop",                                  pl: "Stop", de: "Stopp" },
  "list.rep":               { en: "Rep {n}×",                              pl: "Powt. {n}×", de: "Wdh. {n}×" },
  "list.listenMode":        { en: "Listen mode",                           pl: "Tryb słuchania", de: "Hör-Modus" },
  "list.listenModeHint":    { en: "Listen mode: Russian text is hidden. Tap a card to reveal.", pl: "Tryb słuchania: rosyjski tekst jest ukryty. Dotknij karty, by go zobaczyć.", de: "Hör-Modus: Russischer Text ist verborgen. Karte zum Aufdecken tippen." },
  "list.grammar":           { en: "Grammar notes",                         pl: "Notatki gramatyczne", de: "Grammatik-Notizen" },
  "list.grammar.none":      { en: "No grammar notes for this list yet",    pl: "Brak notatek gramatycznych dla tej listy", de: "Noch keine Grammatik-Notizen für diese Liste" },
  "list.settings":          { en: "Settings",                              pl: "Ustawienia", de: "Einstellungen" },
  "list.help":              { en: "Help",                                  pl: "Pomoc", de: "Hilfe" },
  "list.favoritesOnly":     { en: "Favorites only",                        pl: "Tylko ulubione", de: "Nur Favoriten" },
  "list.calendar":          { en: "Calendar",                              pl: "Kalendarz", de: "Kalender" },
  "list.search":            { en: "Search",                                pl: "Szukaj", de: "Suche" },
  "list.searchPh":          { en: "Search Russian, English, or transliteration…", pl: "Szukaj po rosyjsku, polsku lub transliteracji…", de: "Suche Russisch, Englisch oder Transliteration…" },
  "list.clearSearch":       { en: "Clear search",                          pl: "Wyczyść wyszukiwanie", de: "Suche löschen" },
  "list.empty.cookingTitle":{ en: "Sentences are still cooking…",          pl: "Zdania jeszcze się przygotowują…", de: "Sätze werden noch vorbereitet…" },
  "list.empty.cookingDesc": { en: "This list is being generated. Check back in a moment, or pick another list.", pl: "Ta lista jest generowana. Sprawdź za chwilę albo wybierz inną listę.", de: "Diese Liste wird gerade generiert. Schau gleich wieder vorbei oder wähle eine andere Liste." },
  "list.empty.noMatches":   { en: "No matches",                            pl: "Brak wyników", de: "Keine Treffer" },
  "list.empty.noFavs":      { en: "You haven't favorited any sentences in this list yet.", pl: "Nie masz jeszcze ulubionych zdań na tej liście.", de: "Du hast noch keine Sätze in dieser Liste favorisiert." },
  "list.empty.tryAnother":  { en: "Try a different search term.",          pl: "Spróbuj innego wyszukiwania.", de: "Versuche es mit einem anderen Suchbegriff." },
  "list.card.playSentence": { en: "Play sentence",                         pl: "Odtwórz zdanie", de: "Satz abspielen" },
  "list.card.tapReveal":    { en: "Tap to reveal Russian",                 pl: "Dotknij, aby zobaczyć rosyjski", de: "Tippen, um Russisch anzuzeigen" },
  "list.card.addFav":       { en: "Add to favorites",                      pl: "Dodaj do ulubionych", de: "Zu Favoriten hinzufügen" },
  "list.card.removeFav":    { en: "Remove from favorites",                 pl: "Usuń z ulubionych", de: "Aus Favoriten entfernen" },
  "list.card.playWord":     { en: "Play word {w}",                         pl: "Odtwórz słowo {w}", de: "Wort {w} abspielen" },
  "list.card.stars":        { en: "{n} stars",                             pl: "{n} gwiazdek", de: "{n} Sterne" },
  "list.card.ruHidden":     { en: "Russian hidden",                        pl: "Rosyjski ukryty", de: "Russisch verborgen" },

  // Settings sheet
  "settings.title":         { en: "Practice Settings",                     pl: "Ustawienia ćwiczeń", de: "Übungseinstellungen" },
  "settings.desc":          { en: "Customize repetitions, pauses, and playback.", pl: "Dostosuj liczbę powtórzeń, pauzy i odtwarzanie.", de: "Wiederholungen, Pausen und Wiedergabe anpassen." },
  "settings.appLanguage":   { en: "App language",                          pl: "Język aplikacji", de: "App-Sprache" },
  "settings.appLangHint":   { en: "Choose your interface and translation language.", pl: "Wybierz język interfejsu i tłumaczeń.", de: "Wähle deine Interface- und Übersetzungssprache." },
  "settings.reps":          { en: "Repetitions per Sentence",              pl: "Powtórzenia na zdanie", de: "Wiederholungen pro Satz" },
  "settings.pause":         { en: "Pause Duration",                        pl: "Długość pauzy", de: "Pausendauer" },
  "settings.speed":         { en: "Playback Speed",                        pl: "Prędkość odtwarzania", de: "Wiedergabegeschwindigkeit" },
  "settings.speedNormal":   { en: "{n}× Normal",                           pl: "{n}× Normalna", de: "{n}× Normal" },
  "settings.textSize":      { en: "Text size",                             pl: "Rozmiar tekstu", de: "Textgröße" },
  "settings.translit":      { en: "Transliteration",                       pl: "Transliteracja", de: "Transliteration" },
  "settings.translitHint":  { en: "Show or hide the pronunciation hint below the Russian text.", pl: "Pokaż lub ukryj podpowiedź wymowy pod tekstem rosyjskim.", de: "Aussprachehilfe unter dem russischen Text ein- oder ausblenden." },

  // Grammar sheet
  "grammar.title":          { en: "Grammar notes",                         pl: "Notatki gramatyczne", de: "Grammatiknotizen" },
  "grammar.desc":           { en: "Tap an example to hear it, or jump to the matching sentence in the list.", pl: "Dotknij przykładu, aby go usłyszeć, lub przejdź do pasującego zdania.", de: "Tippe auf ein Beispiel, um es zu hören, oder springe zum passenden Satz in der Liste." },
  "grammar.fromList":       { en: "From this list",                        pl: "Z tej listy", de: "Aus dieser Liste" },
  "grammar.jump":           { en: "Jump to sentence →",                    pl: "Przejdź do zdania →", de: "Zum Satz springen →" },
  "grammar.play":           { en: "Play {t}",                              pl: "Odtwórz {t}", de: "Spiele {t}" },

  // Toasts
  "toast.goalReached":      { en: "Daily goal reached — streak +1 🔥",      pl: "Dzienny cel osiągnięty — passa +1 🔥", de: "Tagesziel erreicht — Streak +1 🔥" },
  "toast.challengeDone":    { en: "Challenge complete! Badge unlocked 🏅", pl: "Wyzwanie ukończone! Odznaka odblokowana 🏅", de: "Herausforderung abgeschlossen! Abzeichen freigeschaltet 🏅" },

  // Profile
  "profile.title":          { en: "Profile",                               pl: "Profil", de: "Profil" },
  "profile.subtitle":       { en: "Your reps, mastered sentences, and favorites.", pl: "Twoje powtórzenia, opanowane zdania i ulubione.", de: "Deine Wiederholungen, gelernten Sätze und Favoriten." },
  "profile.signedIn":       { en: "Signed in",                             pl: "Zalogowany", de: "Angemeldet" },
  "profile.signOut":        { en: "Sign out",                              pl: "Wyloguj", de: "Abmelden" },
  "profile.guestMode":      { en: "You're in guest mode",                  pl: "Jesteś w trybie gościa", de: "Du bist im Gastmodus" },
  "profile.guestHint":      { en: "Your reps and progress are saved on this device only. Sign in to keep them across devices.", pl: "Twoje powtórzenia i postępy zapisują się tylko na tym urządzeniu. Zaloguj się, aby mieć je na wielu urządzeniach.", de: "Deine Wiederholungen und Fortschritte werden nur auf diesem Gerät gespeichert. Melde dich an, um sie geräteübergreifend zu behalten." },
  "profile.signIn":         { en: "Sign in",                               pl: "Zaloguj się", de: "Anmelden" },
  "profile.createAccount":  { en: "Create account",                        pl: "Utwórz konto", de: "Konto erstellen" },
  "profile.continuingGuest":{ en: "Continuing as guest",                   pl: "Kontynuujesz jako gość", de: "Als Gast fortfahren" },
  "profile.startChallenge": { en: "Start your 14-day challenge",           pl: "Zacznij 14-dniowe wyzwanie", de: "Starte deine 14-Tage-Challenge" },
  "profile.startChalDesc":  { en: "Pick a daily reps goal — earn a badge after 14 days hitting it.", pl: "Wybierz dzienny cel powtórzeń — zdobądź odznakę po 14 dniach jego osiągania.", de: "Wähle ein tägliches Ziel — erreiche es 14 Tage lang für ein Abzeichen." },
  "profile.pickGoal":       { en: "Pick goal",                             pl: "Wybierz cel", de: "Ziel wählen" },
  "profile.todayGoal":      { en: "Today's goal",                          pl: "Cel na dziś", de: "Heutiges Ziel" },
  "profile.goalReached":    { en: "Goal reached — nice.",                  pl: "Cel osiągnięty — świetnie.", de: "Ziel erreicht — gut gemacht." },
  "profile.goalToGo":       { en: "{n} reps to go",                        pl: "Jeszcze {n} powtórzeń", de: "Noch {n} Wiederholungen" },
  "profile.changeGoal":     { en: "Change goal",                           pl: "Zmień cel", de: "Ziel ändern" },
  "profile.challengeOf":    { en: "{n} reps/day challenge",                pl: "Wyzwanie {n} powt./dzień", de: "{n} Wiederholungen/Tag Challenge" },
  "profile.completed":      { en: "Completed 🏅",                          pl: "Ukończone 🏅", de: "Abgeschlossen 🏅" },
  "profile.daysOf":         { en: "{done} / {total} days",                 pl: "{done} / {total} dni", de: "{done} / {total} Tage" },
  "profile.badgeEarned":    { en: "Badge earned",                          pl: "Odznaka zdobyta", de: "Abzeichen verdient" },
  "profile.startedOn":      { en: "Started {date} · {pct}%",               pl: "Rozpoczęte {date} · {pct}%", de: "Gestartet {date} · {pct}%" },
  "profile.currentStreak":  { en: "Current streak",                        pl: "Aktualna passa", de: "Aktuelle Serie" },
  "profile.longest":        { en: "Longest",                               pl: "Najdłuższa", de: "Längste" },
  "profile.day":            { en: "day",                                   pl: "dzień", de: "Tag" },
  "profile.days":           { en: "days",                                  pl: "dni", de: "Tage" },
  "profile.14daysAgo":      { en: "14 days ago",                           pl: "14 dni temu", de: "Vor 14 Tagen" },
  "profile.stats":          { en: "Your stats",                            pl: "Twoje statystyki", de: "Deine Statistik" },
  "profile.reps":           { en: "Reps",                                  pl: "Powtórzenia", de: "Wdh." },
  "profile.practiced":      { en: "Practiced",                             pl: "Ćwiczone", de: "Geübt" },
  "profile.mastered":       { en: "Mastered",                              pl: "Opanowane", de: "Gelernt" },
  "profile.favorites":      { en: "Favorites",                             pl: "Ulubione", de: "Favoriten" },
  "profile.byLevel":        { en: "By level",                              pl: "Według poziomu", de: "Nach Level" },
  "profile.levelLine":      { en: "{reps} reps · {practiced} practiced",   pl: "{reps} powt. · {practiced} ćwiczonych", de: "{reps} Wdh. · {practiced} geübt" },
  "profile.keepPracticing": { en: "Want to keep practicing?",              pl: "Chcesz dalej ćwiczyć?", de: "Möchtest du weiter üben?" },
  "profile.badges":         { en: "Badges",                                pl: "Odznaki", de: "Abzeichen" },
  "profile.badgesHint":     { en: "Earn one for each 14-day challenge completed.", pl: "Zdobądź jedną za każde ukończone 14-dniowe wyzwanie.", de: "Verdiene eines für jede abgeschlossene 14-Tage-Challenge." },
  "profile.badgePerDay":    { en: "{n}/day",                               pl: "{n}/dzień", de: "{n}/Tag" },

  // Rank
  "rank.label":             { en: "Rank",                                  pl: "Ranga", de: "Rang" },
  "rank.repsSuffix":        { en: "reps",                                  pl: "powt.", de: "Wdh." },
  "rank.toNext":            { en: "{n} reps to {next}",                    pl: "{n} powt. do: {next}", de: "{n} Wdh. bis {next}" },
  "rank.top":               { en: "Top rank reached. Keep going!",         pl: "Najwyższa ranga osiągnięta. Tak trzymaj!", de: "Höchster Rang erreicht. Mach weiter!" },
  "rank.novice":            { en: "Novice",                                pl: "Nowicjusz", de: "Anfänger" },
  "rank.apprentice":        { en: "Apprentice",                            pl: "Uczeń", de: "Lehrling" },
  "rank.adept":             { en: "Adept",                                 pl: "Adept", de: "Fortgeschrittener" },
  "rank.expert":            { en: "Expert",                                pl: "Ekspert", de: "Experte" },
  "rank.master":            { en: "Master",                                pl: "Mistrz", de: "Meister" },
  "rank.grandmaster":       { en: "Grandmaster",                           pl: "Arcymistrz", de: "Großmeister" },

  // Reps chart
  "chart.title":            { en: "Daily reps",                            pl: "Dzienne powtórzenia", de: "Tägliche Wdh." },
  "chart.summary":          { en: "{total} total · avg {avg}/day · {hit} goal days", pl: "Łącznie {total} · śr. {avg}/dzień · dni z celem: {hit}", de: "{total} gesamt · Ø {avg}/Tag · {hit} Zieltage" },
  "chart.goal":             { en: "goal {n}",                              pl: "cel {n}", de: "Ziel {n}" },

  // Change goal dialog
  "goal.change":            { en: "Change daily goal",                     pl: "Zmień cel dzienny", de: "Tagesziel ändern" },
  "goal.pick":              { en: "Pick your daily challenge",             pl: "Wybierz swoje dzienne wyzwanie", de: "Wähle deine tägliche Challenge" },
  "goal.hint":              { en: "Hit your goal for 14 days to earn a badge.", pl: "Osiągaj cel przez 14 dni, by zdobyć odznakę.", de: "Erreiche dein Ziel an 14 Tagen, um ein Abzeichen zu erhalten." },
  "goal.resetWarn":         { en: "Changing your goal resets your current streak and restarts the 14-day challenge from day 1. Earned badges stay.", pl: "Zmiana celu resetuje obecną passę i restartuje 14-dniowe wyzwanie od dnia 1. Zdobyte odznaki zostają.", de: "Das Ändern deines Ziels setzt deine aktuelle Serie zurück und startet die 14-Tage-Challenge von Tag 1 neu. Erhaltene Abzeichen bleiben bestehen." },
  "goal.repsPerDay":        { en: "reps / day",                            pl: "powt. / dzień", de: "Wdh. / Tag" },
  "goal.reset":             { en: "Reset & start",                         pl: "Zresetuj i zacznij", de: "Zurücksetzen & Starten" },
  "goal.start":             { en: "Start challenge",                       pl: "Zacznij wyzwanie", de: "Challenge starten" },

  // Onboarding
  "onb.title":              { en: "Pick your daily challenge",             pl: "Wybierz swoje dzienne wyzwanie", de: "Wähle deine tägliche Challenge" },
  "onb.desc":               { en: "Practice this many reps every day for 14 days to earn a badge. You can change it later, but your streak will reset.", pl: "Ćwicz tyle powtórzeń każdego dnia przez 14 dni, by zdobyć odznakę. Możesz to później zmienić, ale passa się zresetuje.", de: "Übe 14 Tage lang jeden Tag so viele Wiederholungen, um ein Abzeichen zu verdienen. Du kannst es später ändern, aber deine Serie wird zurückgesetzt." },
  "onb.casual":             { en: "Casual — a few minutes daily.",         pl: "Spokojne — kilka minut dziennie.", de: "Locker — ein paar Minuten täglich." },
  "onb.steady":             { en: "Steady — about 15–20 min.",             pl: "Stałe — około 15–20 min.", de: "Beständig — etwa 15–20 Min." },
  "onb.serious":            { en: "Serious — 30–40 min.",                  pl: "Poważne — 30–40 min.", de: "Ernsthaft — 30–40 Min." },
  "onb.hardcore":           { en: "Hardcore — 1 h+.",                      pl: "Hardcore — 1 h+.", de: "Hardcore — 1 Std.+" },
  "onb.start":              { en: "Start 14-day challenge",                pl: "Zacznij 14-dniowe wyzwanie", de: "14-Tage-Challenge starten" },
  "onb.skip":               { en: "Skip for now",                          pl: "Pomiń na razie", de: "Vorerst überspringen" },

  // Auth
  "auth.continueGuest":     { en: "Continue as guest",                     pl: "Kontynuuj jako gość", de: "Als Gast fortfahren" },
  "auth.signUpTitle":       { en: "Create your account",                   pl: "Utwórz konto", de: "Konto erstellen" },
  "auth.welcomeBack":       { en: "Welcome back",                          pl: "Witaj ponownie", de: "Willkommen zurück" },
  "auth.signUpDesc":        { en: "Save your reps and progress across devices.", pl: "Zapisuj powtórzenia i postępy na wszystkich urządzeniach.", de: "Speichere deine Wiederholungen und Fortschritte geräteübergreifend." },
  "auth.signInDesc":        { en: "Sign in to sync your practice.",        pl: "Zaloguj się, aby synchronizować ćwiczenia.", de: "Melde dich an, um dein Training zu synchronisieren." },
  "auth.signIn":            { en: "Sign in",                               pl: "Zaloguj się", de: "Anmelden" },
  "auth.signUp":            { en: "Sign up",                               pl: "Zarejestruj się", de: "Registrieren" },
  "auth.google":            { en: "Continue with Google",                  pl: "Kontynuuj z Google", de: "Weiter mit Google" },
  "auth.orEmail":           { en: "or with email",                         pl: "lub e-mailem", de: "oder per E-Mail" },
  "auth.email":             { en: "Email",                                 pl: "E-mail", de: "E-Mail" },
  "auth.password":          { en: "Password",                              pl: "Hasło", de: "Passwort" },
  "auth.create":            { en: "Create account",                        pl: "Utwórz konto", de: "Konto erstellen" },
  "auth.confirmEmail":      { en: "Check your email to confirm your account, then sign in.", pl: "Sprawdź e-mail, aby potwierdzić konto, a następnie zaloguj się.", de: "Prüfe deine E-Mails, um dein Konto zu bestätigen, und melde dich dann an." },
  "auth.genericFail":       { en: "Something went wrong",                  pl: "Coś poszło nie tak", de: "Etwas ist schiefgelaufen" },
  "auth.googleFail":        { en: "Google sign-in failed",                 pl: "Logowanie przez Google nie powiodło się", de: "Google-Anmeldung fehlgeschlagen" },
} as const satisfies Record<string, { en: string; pl: string; de?: string }>;

export type StringKey = keyof typeof STRINGS;

export function translate(
  locale: Locale,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  const entry = STRINGS[key] as Record<string, string> | undefined;
  let text = (entry?.[locale] ?? entry?.en ?? key) as string;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}


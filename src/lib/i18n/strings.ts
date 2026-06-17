// Tiny i18n: typed string dictionary keyed by an id. No external library.
// To add a key: declare it on `Strings` and set both `en` and `pl` values.

export type Locale = "en" | "pl";

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "pl", label: "Polski", flag: "🇵🇱" },
];

export const STRINGS = {
  // Nav
  "nav.home":               { en: "Home",                                  pl: "Start" },
  "nav.profile":            { en: "Profile",                               pl: "Profil" },

  // Common
  "common.back":            { en: "Back",                                  pl: "Wstecz" },
  "common.close":           { en: "Close",                                 pl: "Zamknij" },
  "common.cancel":          { en: "Cancel",                                pl: "Anuluj" },
  "common.today":           { en: "Today",                                 pl: "Dziś" },
  "common.locked":          { en: "Locked",                                pl: "Zablokowane" },
  "common.tryAgain":        { en: "Try again",                             pl: "Spróbuj ponownie" },
  "common.goHome":          { en: "Go home",                               pl: "Wróć do startu" },
  "common.pleaseWait":      { en: "Please wait…",                          pl: "Proszę czekać…" },

  // 404 / error
  "err.404Title":           { en: "Page not found",                        pl: "Nie znaleziono strony" },
  "err.404Desc":            { en: "The page you're looking for doesn't exist or has been moved.", pl: "Strona, której szukasz, nie istnieje lub została przeniesiona." },
  "err.bootTitle":          { en: "This page didn't load",                 pl: "Strona się nie wczytała" },
  "err.bootDesc":           { en: "Something went wrong on our end. You can try refreshing or head back home.", pl: "Coś poszło nie tak. Spróbuj odświeżyć stronę lub wrócić do startu." },

  // Home
  "home.title":             { en: "Russian Master",                        pl: "Mistrz Rosyjskiego" },
  "home.tagline":           { en: "A1 → B2 sentence trainer",              pl: "Trener zdań A1 → B2" },
  "home.intro":             { en: "Pick a level and a part to start practicing. Tap a sentence for audio and stress marks.", pl: "Wybierz poziom i część, aby zacząć ćwiczyć. Dotknij zdania, aby usłyszeć je i zobaczyć akcenty." },
  "home.categories":        { en: "categories",                            pl: "kategorie" },
  "home.browseLists":       { en: "Browse lists →",                        pl: "Przeglądaj listy →" },
  "band.Beginner":          { en: "Beginner",                              pl: "Początkujący" },
  "band.Intermediate":      { en: "Intermediate",                          pl: "Średnio zaawansowany" },

  // Level descriptions
  "level.A1.desc":          { en: "Fundamental words and phrases for navigating simple, everyday situations.", pl: "Podstawowe słowa i zwroty do prostych, codziennych sytuacji." },
  "level.A2.desc":          { en: "Essential vocabulary for describing your environment, routine, and recent past.", pl: "Niezbędne słownictwo do opisu otoczenia, codziennej rutyny i niedawnej przeszłości." },
  "level.B1.desc":          { en: "Functional language to express opinions, explain plans, and handle most situations.", pl: "Praktyczny język do wyrażania opinii, omawiania planów i radzenia sobie w większości sytuacji." },
  "level.B2.desc":          { en: "Versatile vocabulary for engaging in complex discussions and expressing views.", pl: "Wszechstronne słownictwo do prowadzenia złożonych rozmów i wyrażania poglądów." },

  // Part themes (A1)
  "part.A1.1":              { en: "Greetings, pronouns, simple states",    pl: "Powitania, zaimki, proste stany" },
  "part.A1.2":              { en: "Family, numbers, colors, days",         pl: "Rodzina, liczby, kolory, dni" },
  "part.A1.3":              { en: "Common verbs in the present",           pl: "Często używane czasowniki w czasie teraźniejszym" },
  "part.A1.4":              { en: "Places, directions, basic questions",   pl: "Miejsca, kierunki, podstawowe pytania" },
  // A2
  "part.A2.1":              { en: "Daily routine and past tense",          pl: "Codzienna rutyna i czas przeszły" },
  "part.A2.2":              { en: "Food, ordering, modal verbs",           pl: "Jedzenie, zamawianie, czasowniki modalne" },
  "part.A2.3":              { en: "Travel, transport, future plans",       pl: "Podróże, transport, plany na przyszłość" },
  "part.A2.4":              { en: "Weather, clothing, feelings",           pl: "Pogoda, ubrania, uczucia" },
  // B1
  "part.B1.1":              { en: "Opinions, feelings, complex thoughts",  pl: "Opinie, uczucia, złożone myśli" },
  "part.B1.2":              { en: "Work, study, conditionals",             pl: "Praca, nauka, tryb warunkowy" },
  "part.B1.3":              { en: "Health, body, reflexives",              pl: "Zdrowie, ciało, czasowniki zwrotne" },
  "part.B1.4":              { en: "City life, comparisons, culture",       pl: "Życie w mieście, porównania, kultura" },
  // B2
  "part.B2.1":              { en: "Society, participles, gerunds",         pl: "Społeczeństwo, imiesłowy" },
  "part.B2.2":              { en: "News, environment, formal speech",      pl: "Wiadomości, środowisko, mowa formalna" },
  "part.B2.3":              { en: "Idioms and colloquial expressions",     pl: "Idiomy i zwroty potoczne" },
  "part.B2.4":              { en: "Literature, narrative, indirect speech", pl: "Literatura, narracja, mowa zależna" },

  // Level list title pattern (uses {level} {part})
  "list.levelPartTitle":    { en: "{level} Level — Part {part}",           pl: "Poziom {level} — Część {part}" },

  // Extras
  "extra.basicVerb.title":  { en: "Basic Verb Conjugations",               pl: "Podstawowa koniugacja czasowników" },
  "extra.basicVerb.desc":   { en: "Present · Past · Future",               pl: "Teraźniejszy · Przeszły · Przyszły" },
  "extra.adj.title":        { en: "300 Most Common Adjectives",            pl: "300 najczęstszych przymiotników" },
  "extra.adj.desc":         { en: "Essential descriptors to add detail and variety to your daily language.", pl: "Najważniejsze określenia, by wzbogacić codzienny język." },
  "extra.adv.title":        { en: "300 Most Common Adverbs",               pl: "300 najczęstszych przysłówków" },
  "extra.adv.desc":         { en: "Key modifiers to express how, when, and where actions take place.", pl: "Kluczowe wyrazy do wyrażania jak, kiedy i gdzie odbywają się czynności." },
  "extra.verb.title":       { en: "300 Most Common Verbs",                 pl: "300 najczęstszych czasowników" },
  "extra.verb.desc":        { en: "Essential action words to describe activities and states of being.", pl: "Najważniejsze czasowniki do opisu czynności i stanów." },

  // List page header / stats
  "list.vocabulary":        { en: "Vocabulary",                            pl: "Słownictwo" },
  "list.stat.practiced":    { en: "PRACTICED",                             pl: "ĆWICZONE" },
  "list.stat.reps":         { en: "REPS",                                  pl: "POWTÓRZENIA" },
  "list.stat.mastered":     { en: "MASTERED",                              pl: "OPANOWANE" },
  // Play bar
  "list.play":              { en: "Play all",                              pl: "Odtwórz wszystko" },
  "list.stop":              { en: "Stop",                                  pl: "Stop" },
  "list.rep":               { en: "Rep {n}×",                              pl: "Powt. {n}×" },
  "list.listenMode":        { en: "Listen mode",                           pl: "Tryb słuchania" },
  "list.listenModeHint":    { en: "Listen mode: Russian text is hidden. Tap a card to reveal.", pl: "Tryb słuchania: rosyjski tekst jest ukryty. Dotknij karty, by go zobaczyć." },
  "list.grammar":           { en: "Grammar notes",                         pl: "Notatki gramatyczne" },
  "list.grammar.none":      { en: "No grammar notes for this list yet",    pl: "Brak notatek gramatycznych dla tej listy" },
  "list.settings":          { en: "Settings",                              pl: "Ustawienia" },
  "list.help":              { en: "Help",                                  pl: "Pomoc" },
  "list.favoritesOnly":     { en: "Favorites only",                        pl: "Tylko ulubione" },
  "list.calendar":          { en: "Calendar",                              pl: "Kalendarz" },
  "list.search":            { en: "Search",                                pl: "Szukaj" },
  "list.searchPh":          { en: "Search Russian, English, or transliteration…", pl: "Szukaj po rosyjsku, polsku lub transliteracji…" },
  "list.clearSearch":       { en: "Clear search",                          pl: "Wyczyść wyszukiwanie" },
  "list.empty.cookingTitle":{ en: "Sentences are still cooking…",          pl: "Zdania jeszcze się przygotowują…" },
  "list.empty.cookingDesc": { en: "This list is being generated. Check back in a moment, or pick another list.", pl: "Ta lista jest generowana. Sprawdź za chwilę albo wybierz inną listę." },
  "list.empty.noMatches":   { en: "No matches",                            pl: "Brak wyników" },
  "list.empty.noFavs":      { en: "You haven't favorited any sentences in this list yet.", pl: "Nie masz jeszcze ulubionych zdań na tej liście." },
  "list.empty.tryAnother":  { en: "Try a different search term.",          pl: "Spróbuj innego wyszukiwania." },
  "list.card.playSentence": { en: "Play sentence",                         pl: "Odtwórz zdanie" },
  "list.card.tapReveal":    { en: "Tap to reveal Russian",                 pl: "Dotknij, aby zobaczyć rosyjski" },
  "list.card.addFav":       { en: "Add to favorites",                      pl: "Dodaj do ulubionych" },
  "list.card.removeFav":    { en: "Remove from favorites",                 pl: "Usuń z ulubionych" },
  "list.card.playWord":     { en: "Play word {w}",                         pl: "Odtwórz słowo {w}" },
  "list.card.stars":        { en: "{n} stars",                             pl: "{n} gwiazdek" },
  "list.card.ruHidden":     { en: "Russian hidden",                        pl: "Rosyjski ukryty" },

  // Settings sheet
  "settings.title":         { en: "Practice Settings",                     pl: "Ustawienia ćwiczeń" },
  "settings.desc":          { en: "Customize repetitions, pauses, and playback.", pl: "Dostosuj liczbę powtórzeń, pauzy i odtwarzanie." },
  "settings.appLanguage":   { en: "App language",                          pl: "Język aplikacji" },
  "settings.appLangHint":   { en: "Choose your interface and translation language.", pl: "Wybierz język interfejsu i tłumaczeń." },
  "settings.reps":          { en: "Repetitions per Sentence",              pl: "Powtórzenia na zdanie" },
  "settings.pause":         { en: "Pause Duration",                        pl: "Długość pauzy" },
  "settings.speed":         { en: "Playback Speed",                        pl: "Prędkość odtwarzania" },
  "settings.speedNormal":   { en: "{n}× Normal",                           pl: "{n}× Normalna" },
  "settings.textSize":      { en: "Text size",                             pl: "Rozmiar tekstu" },
  "settings.translit":      { en: "Transliteration",                       pl: "Transliteracja" },
  "settings.translitHint":  { en: "Show or hide the pronunciation hint below the Russian text.", pl: "Pokaż lub ukryj podpowiedź wymowy pod tekstem rosyjskim." },

  // Grammar sheet
  "grammar.title":          { en: "Grammar notes",                         pl: "Notatki gramatyczne" },
  "grammar.desc":           { en: "Tap an example to hear it, or jump to the matching sentence in the list.", pl: "Dotknij przykładu, aby go usłyszeć, lub przejdź do pasującego zdania." },
  "grammar.fromList":       { en: "From this list",                        pl: "Z tej listy" },
  "grammar.jump":           { en: "Jump to sentence →",                    pl: "Przejdź do zdania →" },
  "grammar.play":           { en: "Play {t}",                              pl: "Odtwórz {t}" },

  // Toasts
  "toast.goalReached":      { en: "Daily goal reached — streak +1 🔥",      pl: "Dzienny cel osiągnięty — passa +1 🔥" },
  "toast.challengeDone":    { en: "Challenge complete! Badge unlocked 🏅", pl: "Wyzwanie ukończone! Odznaka odblokowana 🏅" },

  // Profile
  "profile.title":          { en: "Profile",                               pl: "Profil" },
  "profile.subtitle":       { en: "Your reps, mastered sentences, and favorites.", pl: "Twoje powtórzenia, opanowane zdania i ulubione." },
  "profile.signedIn":       { en: "Signed in",                             pl: "Zalogowany" },
  "profile.signOut":        { en: "Sign out",                              pl: "Wyloguj" },
  "profile.guestMode":      { en: "You're in guest mode",                  pl: "Jesteś w trybie gościa" },
  "profile.guestHint":      { en: "Your reps and progress are saved on this device only. Sign in to keep them across devices.", pl: "Twoje powtórzenia i postępy zapisują się tylko na tym urządzeniu. Zaloguj się, aby mieć je na wielu urządzeniach." },
  "profile.signIn":         { en: "Sign in",                               pl: "Zaloguj się" },
  "profile.createAccount":  { en: "Create account",                        pl: "Utwórz konto" },
  "profile.continuingGuest":{ en: "Continuing as guest",                   pl: "Kontynuujesz jako gość" },
  "profile.startChallenge": { en: "Start your 14-day challenge",           pl: "Zacznij 14-dniowe wyzwanie" },
  "profile.startChalDesc":  { en: "Pick a daily reps goal — earn a badge after 14 days hitting it.", pl: "Wybierz dzienny cel powtórzeń — zdobądź odznakę po 14 dniach jego osiągania." },
  "profile.pickGoal":       { en: "Pick goal",                             pl: "Wybierz cel" },
  "profile.todayGoal":      { en: "Today's goal",                          pl: "Cel na dziś" },
  "profile.goalReached":    { en: "Goal reached — nice.",                  pl: "Cel osiągnięty — świetnie." },
  "profile.goalToGo":       { en: "{n} reps to go",                        pl: "Jeszcze {n} powtórzeń" },
  "profile.changeGoal":     { en: "Change goal",                           pl: "Zmień cel" },
  "profile.challengeOf":    { en: "{n} reps/day challenge",                pl: "Wyzwanie {n} powt./dzień" },
  "profile.completed":      { en: "Completed 🏅",                          pl: "Ukończone 🏅" },
  "profile.daysOf":         { en: "{done} / {total} days",                 pl: "{done} / {total} dni" },
  "profile.badgeEarned":    { en: "Badge earned",                          pl: "Odznaka zdobyta" },
  "profile.startedOn":      { en: "Started {date} · {pct}%",               pl: "Rozpoczęte {date} · {pct}%" },
  "profile.currentStreak":  { en: "Current streak",                        pl: "Aktualna passa" },
  "profile.longest":        { en: "Longest",                               pl: "Najdłuższa" },
  "profile.day":            { en: "day",                                   pl: "dzień" },
  "profile.days":           { en: "days",                                  pl: "dni" },
  "profile.14daysAgo":      { en: "14 days ago",                           pl: "14 dni temu" },
  "profile.stats":          { en: "Your stats",                            pl: "Twoje statystyki" },
  "profile.reps":           { en: "Reps",                                  pl: "Powtórzenia" },
  "profile.practiced":      { en: "Practiced",                             pl: "Ćwiczone" },
  "profile.mastered":       { en: "Mastered",                              pl: "Opanowane" },
  "profile.favorites":      { en: "Favorites",                             pl: "Ulubione" },
  "profile.byLevel":        { en: "By level",                              pl: "Według poziomu" },
  "profile.levelLine":      { en: "{reps} reps · {practiced} practiced",   pl: "{reps} powt. · {practiced} ćwiczonych" },
  "profile.keepPracticing": { en: "Want to keep practicing?",              pl: "Chcesz dalej ćwiczyć?" },
  "profile.badges":         { en: "Badges",                                pl: "Odznaki" },
  "profile.badgesHint":     { en: "Earn one for each 14-day challenge completed.", pl: "Zdobądź jedną za każde ukończone 14-dniowe wyzwanie." },
  "profile.badgePerDay":    { en: "{n}/day",                               pl: "{n}/dzień" },

  // Rank
  "rank.label":             { en: "Rank",                                  pl: "Ranga" },
  "rank.repsSuffix":        { en: "reps",                                  pl: "powt." },
  "rank.toNext":            { en: "{n} reps to {next}",                    pl: "{n} powt. do: {next}" },
  "rank.top":               { en: "Top rank reached. Keep going!",         pl: "Najwyższa ranga osiągnięta. Tak trzymaj!" },
  "rank.novice":            { en: "Novice",                                pl: "Nowicjusz" },
  "rank.apprentice":        { en: "Apprentice",                            pl: "Uczeń" },
  "rank.adept":             { en: "Adept",                                 pl: "Adept" },
  "rank.expert":            { en: "Expert",                                pl: "Ekspert" },
  "rank.master":            { en: "Master",                                pl: "Mistrz" },
  "rank.grandmaster":       { en: "Grandmaster",                           pl: "Arcymistrz" },

  // Reps chart
  "chart.title":            { en: "Daily reps",                            pl: "Dzienne powtórzenia" },
  "chart.summary":          { en: "{total} total · avg {avg}/day · {hit} goal days", pl: "Łącznie {total} · śr. {avg}/dzień · dni z celem: {hit}" },
  "chart.goal":             { en: "goal {n}",                              pl: "cel {n}" },

  // Change goal dialog
  "goal.change":            { en: "Change daily goal",                     pl: "Zmień cel dzienny" },
  "goal.pick":              { en: "Pick your daily challenge",             pl: "Wybierz swoje dzienne wyzwanie" },
  "goal.hint":              { en: "Hit your goal for 14 days to earn a badge.", pl: "Osiągaj cel przez 14 dni, by zdobyć odznakę." },
  "goal.resetWarn":         { en: "Changing your goal resets your current streak and restarts the 14-day challenge from day 1. Earned badges stay.", pl: "Zmiana celu resetuje obecną passę i restartuje 14-dniowe wyzwanie od dnia 1. Zdobyte odznaki zostają." },
  "goal.repsPerDay":        { en: "reps / day",                            pl: "powt. / dzień" },
  "goal.reset":             { en: "Reset & start",                         pl: "Zresetuj i zacznij" },
  "goal.start":             { en: "Start challenge",                       pl: "Zacznij wyzwanie" },

  // Onboarding
  "onb.title":              { en: "Pick your daily challenge",             pl: "Wybierz swoje dzienne wyzwanie" },
  "onb.desc":               { en: "Practice this many reps every day for 14 days to earn a badge. You can change it later, but your streak will reset.", pl: "Ćwicz tyle powtórzeń każdego dnia przez 14 dni, by zdobyć odznakę. Możesz to później zmienić, ale passa się zresetuje." },
  "onb.casual":             { en: "Casual — a few minutes daily.",         pl: "Spokojne — kilka minut dziennie." },
  "onb.steady":             { en: "Steady — about 15–20 min.",             pl: "Stałe — około 15–20 min." },
  "onb.serious":            { en: "Serious — 30–40 min.",                  pl: "Poważne — 30–40 min." },
  "onb.hardcore":           { en: "Hardcore — 1 h+.",                      pl: "Hardcore — 1 h+." },
  "onb.start":              { en: "Start 14-day challenge",                pl: "Zacznij 14-dniowe wyzwanie" },
  "onb.skip":               { en: "Skip for now",                          pl: "Pomiń na razie" },

  // Auth
  "auth.continueGuest":     { en: "Continue as guest",                     pl: "Kontynuuj jako gość" },
  "auth.signUpTitle":       { en: "Create your account",                   pl: "Utwórz konto" },
  "auth.welcomeBack":       { en: "Welcome back",                          pl: "Witaj ponownie" },
  "auth.signUpDesc":        { en: "Save your reps and progress across devices.", pl: "Zapisuj powtórzenia i postępy na wszystkich urządzeniach." },
  "auth.signInDesc":        { en: "Sign in to sync your practice.",        pl: "Zaloguj się, aby synchronizować ćwiczenia." },
  "auth.signIn":            { en: "Sign in",                               pl: "Zaloguj się" },
  "auth.signUp":            { en: "Sign up",                               pl: "Zarejestruj się" },
  "auth.google":            { en: "Continue with Google",                  pl: "Kontynuuj z Google" },
  "auth.orEmail":           { en: "or with email",                         pl: "lub e-mailem" },
  "auth.email":             { en: "Email",                                 pl: "E-mail" },
  "auth.password":          { en: "Password",                              pl: "Hasło" },
  "auth.create":            { en: "Create account",                        pl: "Utwórz konto" },
  "auth.confirmEmail":      { en: "Check your email to confirm your account, then sign in.", pl: "Sprawdź e-mail, aby potwierdzić konto, a następnie zaloguj się." },
  "auth.genericFail":       { en: "Something went wrong",                  pl: "Coś poszło nie tak" },
  "auth.googleFail":        { en: "Google sign-in failed",                 pl: "Logowanie przez Google nie powiodło się" },
} as const satisfies Record<string, { en: string; pl: string }>;

export type StringKey = keyof typeof STRINGS;

export function translate(
  locale: Locale,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  const entry = STRINGS[key];
  let text = (entry?.[locale] ?? entry?.en ?? key) as string;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

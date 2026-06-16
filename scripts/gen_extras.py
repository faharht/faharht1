#!/usr/bin/env python3
"""Generate Basic Verb Conjugations + Top-300 Adjectives/Adverbs/Verbs lists.
Schema per entry: { id, ru, ruStressed, translit, en }.
"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "sentences")

# ============================================================
# BASIC VERB CONJUGATIONS — Present, Past, Future. ~150 sentences.
# Covers ~25 high-frequency verbs across 1st/2nd/3rd person & 3 tenses.
# ============================================================
CONJ = [
    # быть (to be) — present is usually omitted; past/future forms
    ["Вчера я был дома.", "Вчера́ я был до́ма.", "Vchera ya byl doma.", "Yesterday I was at home."],
    ["Она была учительницей.", "Она́ была́ учи́тельницей.", "Ona byla uchitelnitsey.", "She was a teacher."],
    ["Мы были в парке.", "Мы бы́ли в па́рке.", "My byli v parke.", "We were in the park."],
    ["Завтра я буду на работе.", "За́втра я бу́ду на рабо́те.", "Zavtra ya budu na rabote.", "Tomorrow I'll be at work."],
    ["Ты будешь дома вечером?", "Ты бу́дешь до́ма ве́чером?", "Ty budesh doma vecherom?", "Will you be home in the evening?"],
    ["Они будут рады нас видеть.", "Они́ бу́дут ра́ды нас ви́деть.", "Oni budut rady nas videt.", "They will be glad to see us."],

    # идти (to go on foot, present-direction)
    ["Я иду в магазин.", "Я иду́ в магази́н.", "Ya idu v magazin.", "I am going to the store."],
    ["Ты идёшь домой?", "Ты идёшь домо́й?", "Ty idyosh domoy?", "Are you going home?"],
    ["Он идёт по улице.", "Он идёт по у́лице.", "On idyot po ulitse.", "He is walking along the street."],
    ["Мы идём в кино.", "Мы идём в кино́.", "My idyom v kino.", "We are going to the cinema."],
    ["Вчера я шёл пешком.", "Вчера́ я шёл пешко́м.", "Vchera ya shyol peshkom.", "Yesterday I walked."],
    ["Она шла очень медленно.", "Она́ шла о́чень ме́дленно.", "Ona shla ochen medlenno.", "She walked very slowly."],

    # ходить (multidirectional go)
    ["Я хожу в школу пешком.", "Я хожу́ в шко́лу пешко́м.", "Ya khozhu v shkolu peshkom.", "I walk to school."],
    ["Ты ходишь в спортзал?", "Ты хо́дишь в спортза́л?", "Ty khodish v sportzal?", "Do you go to the gym?"],
    ["Он часто ходит в театр.", "Он ча́сто хо́дит в теа́тр.", "On chasto khodit v teatr.", "He often goes to the theater."],

    # ехать (to go by vehicle, directional)
    ["Я еду на работу.", "Я е́ду на рабо́ту.", "Ya edu na rabotu.", "I am going to work."],
    ["Ты едешь в отпуск?", "Ты е́дешь в о́тпуск?", "Ty edesh v otpusk?", "Are you going on vacation?"],
    ["Он едет на машине.", "Он е́дет на маши́не.", "On edet na mashine.", "He is driving."],
    ["Вчера мы ехали два часа.", "Вчера́ мы е́хали два часа́.", "Vchera my ekhali dva chasa.", "Yesterday we rode for two hours."],
    ["Завтра я поеду в Москву.", "За́втра я пое́ду в Москву́.", "Zavtra ya poedu v Moskvu.", "Tomorrow I'll go to Moscow."],

    # говорить (to speak)
    ["Я говорю по-английски.", "Я говорю́ по-англи́йски.", "Ya govoryu po-angliyski.", "I speak English."],
    ["Ты говоришь по-русски?", "Ты говори́шь по-ру́сски?", "Ty govorish po-russki?", "Do you speak Russian?"],
    ["Он говорит тихо.", "Он говори́т ти́хо.", "On govorit tikho.", "He speaks quietly."],
    ["Мы говорим о работе.", "Мы говори́м о рабо́те.", "My govorim o rabote.", "We are talking about work."],
    ["Вы говорите слишком быстро.", "Вы говори́те сли́шком бы́стро.", "Vy govorite slishkom bystro.", "You speak too fast."],
    ["Они говорят на трёх языках.", "Они́ говоря́т на трёх языка́х.", "Oni govoryat na tryokh yazykakh.", "They speak three languages."],
    ["Вчера мы долго говорили.", "Вчера́ мы до́лго говори́ли.", "Vchera my dolgo govorili.", "Yesterday we talked for a long time."],
    ["Завтра я буду говорить с боссом.", "За́втра я бу́ду говори́ть с бо́ссом.", "Zavtra ya budu govorit s bossom.", "Tomorrow I'll speak with the boss."],

    # делать (to do)
    ["Что ты делаешь?", "Что ты де́лаешь?", "Chto ty delaesh?", "What are you doing?"],
    ["Я делаю уроки.", "Я де́лаю уро́ки.", "Ya delayu uroki.", "I'm doing homework."],
    ["Он ничего не делает.", "Он ничего́ не де́лает.", "On nichego ne delaet.", "He doesn't do anything."],
    ["Мы делаем проект вместе.", "Мы де́лаем прое́кт вме́сте.", "My delaem proekt vmeste.", "We're doing the project together."],
    ["Вчера я делал презентацию.", "Вчера́ я де́лал презента́цию.", "Vchera ya delal prezentatsiyu.", "Yesterday I was making a presentation."],
    ["Что вы будете делать завтра?", "Что вы бу́дете де́лать за́втра?", "Chto vy budete delat zavtra?", "What will you do tomorrow?"],
    ["Я сделаю это завтра.", "Я сде́лаю э́то за́втра.", "Ya sdelayu eto zavtra.", "I'll do it tomorrow."],

    # читать (to read)
    ["Я читаю книгу.", "Я чита́ю кни́гу.", "Ya chitayu knigu.", "I'm reading a book."],
    ["Ты часто читаешь?", "Ты ча́сто чита́ешь?", "Ty chasto chitaesh?", "Do you read often?"],
    ["Она читает газету.", "Она́ чита́ет газе́ту.", "Ona chitaet gazetu.", "She is reading a newspaper."],
    ["Вчера я читал весь вечер.", "Вчера́ я чита́л весь ве́чер.", "Vchera ya chital ves vecher.", "Yesterday I read all evening."],
    ["Завтра я прочитаю эту статью.", "За́втра я прочита́ю э́ту статью́.", "Zavtra ya prochitayu etu statyu.", "Tomorrow I'll read this article."],

    # писать (to write)
    ["Я пишу письмо.", "Я пишу́ письмо́.", "Ya pishu pismo.", "I'm writing a letter."],
    ["Ты пишешь стихи?", "Ты пи́шешь стихи́?", "Ty pishesh stikhi?", "Do you write poems?"],
    ["Он пишет роман.", "Он пи́шет рома́н.", "On pishet roman.", "He is writing a novel."],
    ["Вчера она писала отчёт.", "Вчера́ она́ писа́ла отчёт.", "Vchera ona pisala otchyot.", "Yesterday she was writing a report."],
    ["Завтра я напишу тебе.", "За́втра я напишу́ тебе́.", "Zavtra ya napishu tebe.", "Tomorrow I'll write to you."],

    # есть (to eat)
    ["Я ем завтрак.", "Я ем за́втрак.", "Ya em zavtrak.", "I'm eating breakfast."],
    ["Ты ешь мясо?", "Ты ешь мя́со?", "Ty esh myaso?", "Do you eat meat?"],
    ["Он ест очень быстро.", "Он ест о́чень бы́стро.", "On est ochen bystro.", "He eats very fast."],
    ["Мы едим вместе каждый вечер.", "Мы еди́м вме́сте ка́ждый ве́чер.", "My edim vmeste kazhdyy vecher.", "We eat together every evening."],
    ["Вчера я ел в новом ресторане.", "Вчера́ я ел в но́вом рестора́не.", "Vchera ya el v novom restorane.", "Yesterday I ate at a new restaurant."],
    ["Что мы будем есть на ужин?", "Что мы бу́дем есть на у́жин?", "Chto my budem est na uzhin?", "What will we eat for dinner?"],

    # пить (to drink)
    ["Я пью кофе утром.", "Я пью ко́фе у́тром.", "Ya pyu kofe utrom.", "I drink coffee in the morning."],
    ["Ты пьёшь чай?", "Ты пьёшь чай?", "Ty pyosh chay?", "Do you drink tea?"],
    ["Она пьёт сок.", "Она́ пьёт сок.", "Ona pyot sok.", "She is drinking juice."],
    ["Вчера мы пили вино.", "Вчера́ мы пи́ли вино́.", "Vchera my pili vino.", "Yesterday we drank wine."],
    ["Я выпью стакан воды.", "Я вы́пью стака́н воды́.", "Ya vypyu stakan vody.", "I'll drink a glass of water."],

    # видеть (to see)
    ["Я вижу птицу.", "Я ви́жу пти́цу.", "Ya vizhu ptitsu.", "I see a bird."],
    ["Ты видишь это?", "Ты ви́дишь э́то?", "Ty vidish eto?", "Do you see this?"],
    ["Он видит её каждый день.", "Он ви́дит её ка́ждый день.", "On vidit eyo kazhdyy den.", "He sees her every day."],
    ["Вчера я видел старого друга.", "Вчера́ я ви́дел ста́рого дру́га.", "Vchera ya videl starogo druga.", "Yesterday I saw an old friend."],
    ["Завтра я увижу маму.", "За́втра я уви́жу ма́му.", "Zavtra ya uvizhu mamu.", "Tomorrow I'll see mom."],

    # знать (to know)
    ["Я знаю ответ.", "Я зна́ю отве́т.", "Ya znayu otvet.", "I know the answer."],
    ["Ты знаешь его?", "Ты зна́ешь его́?", "Ty znaesh ego?", "Do you know him?"],
    ["Он знает всё.", "Он зна́ет всё.", "On znaet vsyo.", "He knows everything."],
    ["Мы знали об этом.", "Мы зна́ли об э́том.", "My znali ob etom.", "We knew about this."],
    ["Я узнаю завтра.", "Я узна́ю за́втра.", "Ya uznayu zavtra.", "I'll find out tomorrow."],

    # хотеть (to want)
    ["Я хочу пить.", "Я хочу́ пить.", "Ya khochu pit.", "I want to drink."],
    ["Ты хочешь чаю?", "Ты хо́чешь ча́ю?", "Ty khochesh chayu?", "Do you want tea?"],
    ["Он хочет спать.", "Он хо́чет спать.", "On khochet spat.", "He wants to sleep."],
    ["Мы хотим путешествовать.", "Мы хоти́м путеше́ствовать.", "My khotim puteshestvovat.", "We want to travel."],
    ["Вы хотите кофе?", "Вы хоти́те ко́фе?", "Vy khotite kofe?", "Would you like coffee?"],
    ["Они хотят купить машину.", "Они́ хотя́т купи́ть маши́ну.", "Oni khotyat kupit mashinu.", "They want to buy a car."],
    ["Вчера я хотел остаться.", "Вчера́ я хоте́л оста́ться.", "Vchera ya khotel ostatsya.", "Yesterday I wanted to stay."],

    # мочь (can, be able)
    ["Я могу помочь.", "Я могу́ помо́чь.", "Ya mogu pomoch.", "I can help."],
    ["Ты можешь подождать?", "Ты мо́жешь подожда́ть?", "Ty mozhesh podozhdat?", "Can you wait?"],
    ["Он может говорить по-французски.", "Он мо́жет говори́ть по-францу́зски.", "On mozhet govorit po-frantsuzski.", "He can speak French."],
    ["Мы не могли прийти.", "Мы не могли́ прийти́.", "My ne mogli priyti.", "We couldn't come."],
    ["Я смогу это сделать.", "Я смогу́ э́то сде́лать.", "Ya smogu eto sdelat.", "I'll be able to do it."],

    # любить (to love)
    ["Я люблю свою семью.", "Я люблю́ свою́ семью́.", "Ya lyublyu svoyu semyu.", "I love my family."],
    ["Ты любишь музыку?", "Ты лю́бишь му́зыку?", "Ty lyubish muzyku?", "Do you love music?"],
    ["Он любит играть в шахматы.", "Он лю́бит игра́ть в ша́хматы.", "On lyubit igrat v shakhmaty.", "He loves to play chess."],
    ["Мы любим море.", "Мы лю́бим мо́ре.", "My lyubim more.", "We love the sea."],
    ["В детстве я любил рисовать.", "В де́тстве я люби́л рисова́ть.", "V detstve ya lyubil risovat.", "As a child I loved to draw."],

    # жить (to live)
    ["Я живу в Берлине.", "Я живу́ в Берли́не.", "Ya zhivu v Berline.", "I live in Berlin."],
    ["Ты живёшь один?", "Ты живёшь оди́н?", "Ty zhivyosh odin?", "Do you live alone?"],
    ["Она живёт с родителями.", "Она́ живёт с роди́телями.", "Ona zhivyot s roditelyami.", "She lives with her parents."],
    ["Раньше мы жили в деревне.", "Ра́ньше мы жи́ли в дере́вне.", "Ranshe my zhili v derevne.", "We used to live in a village."],
    ["Я буду жить за границей.", "Я бу́ду жить за грани́цей.", "Ya budu zhit za granitsey.", "I will live abroad."],

    # работать (to work)
    ["Я работаю в офисе.", "Я рабо́таю в о́фисе.", "Ya rabotayu v ofise.", "I work in an office."],
    ["Ты работаешь сегодня?", "Ты рабо́таешь сего́дня?", "Ty rabotaesh segodnya?", "Are you working today?"],
    ["Он работает программистом.", "Он рабо́тает программи́стом.", "On rabotaet programmistom.", "He works as a programmer."],
    ["Мы работаем над проектом.", "Мы рабо́таем над прое́ктом.", "My rabotaem nad proektom.", "We're working on a project."],
    ["Вчера я работал допоздна.", "Вчера́ я рабо́тал допоздна́.", "Vchera ya rabotal dopozdna.", "Yesterday I worked late."],
    ["Завтра я не буду работать.", "За́втра я не бу́ду рабо́тать.", "Zavtra ya ne budu rabotat.", "Tomorrow I won't work."],

    # учиться (to study)
    ["Я учусь в университете.", "Я учу́сь в университе́те.", "Ya uchus v universitete.", "I study at the university."],
    ["Ты учишься на врача?", "Ты у́чишься на врача́?", "Ty uchishsya na vracha?", "Are you studying to be a doctor?"],
    ["Он учится в школе.", "Он у́чится в шко́ле.", "On uchitsya v shkole.", "He studies at school."],
    ["Мы учились вместе.", "Мы учи́лись вме́сте.", "My uchilis vmeste.", "We studied together."],

    # спать (to sleep)
    ["Я сплю восемь часов.", "Я сплю во́семь часо́в.", "Ya splyu vosem chasov.", "I sleep eight hours."],
    ["Ты спишь?", "Ты спишь?", "Ty spish?", "Are you sleeping?"],
    ["Ребёнок спит.", "Ребёнок спит.", "Rebyonok spit.", "The child is sleeping."],
    ["Вчера я плохо спал.", "Вчера́ я пло́хо спал.", "Vchera ya plokho spal.", "Yesterday I slept badly."],
    ["Я буду спать до десяти.", "Я бу́ду спать до десяти́.", "Ya budu spat do desyati.", "I'll sleep until ten."],

    # думать (to think)
    ["Я думаю о тебе.", "Я ду́маю о тебе́.", "Ya dumayu o tebe.", "I'm thinking about you."],
    ["О чём ты думаешь?", "О чём ты ду́маешь?", "O chyom ty dumaesh?", "What are you thinking about?"],
    ["Он думает, что прав.", "Он ду́мает, что прав.", "On dumaet, chto prav.", "He thinks he's right."],
    ["Мы долго думали.", "Мы до́лго ду́мали.", "My dolgo dumali.", "We thought for a long time."],
    ["Я подумаю об этом.", "Я поду́маю об э́том.", "Ya podumayu ob etom.", "I'll think about it."],

    # понимать (to understand)
    ["Я понимаю по-русски.", "Я понима́ю по-ру́сски.", "Ya ponimayu po-russki.", "I understand Russian."],
    ["Ты понимаешь меня?", "Ты понима́ешь меня́?", "Ty ponimaesh menya?", "Do you understand me?"],
    ["Он не понимает шуток.", "Он не понима́ет шу́ток.", "On ne ponimaet shutok.", "He doesn't understand jokes."],
    ["Вчера я не понял ничего.", "Вчера́ я не по́нял ничего́.", "Vchera ya ne ponyal nichego.", "Yesterday I didn't understand anything."],
    ["Я скоро всё пойму.", "Я ско́ро всё пойму́.", "Ya skoro vsyo poymu.", "Soon I'll understand everything."],

    # давать (to give)
    ["Я даю тебе совет.", "Я даю́ тебе́ сове́т.", "Ya dayu tebe sovet.", "I'm giving you advice."],
    ["Ты даёшь мне шанс?", "Ты даёшь мне шанс?", "Ty dayosh mne shans?", "Are you giving me a chance?"],
    ["Он даёт уроки.", "Он даёт уро́ки.", "On dayot uroki.", "He gives lessons."],
    ["Мама дала мне денег.", "Ма́ма дала́ мне де́нег.", "Mama dala mne deneg.", "Mom gave me money."],
    ["Я дам ответ завтра.", "Я дам отве́т за́втра.", "Ya dam otvet zavtra.", "I'll give an answer tomorrow."],

    # брать (to take)
    ["Я беру книгу.", "Я беру́ кни́гу.", "Ya beru knigu.", "I'm taking the book."],
    ["Ты берёшь зонт?", "Ты берёшь зонт?", "Ty beryosh zont?", "Are you taking the umbrella?"],
    ["Он берёт такси.", "Он берёт такси́.", "On beryot taksi.", "He's taking a taxi."],
    ["Вчера я взял отпуск.", "Вчера́ я взял о́тпуск.", "Vchera ya vzyal otpusk.", "Yesterday I took a vacation."],
    ["Я возьму это с собой.", "Я возьму́ э́то с собо́й.", "Ya vozmu eto s soboy.", "I'll take this with me."],

    # ждать (to wait)
    ["Я жду автобус.", "Я жду авто́бус.", "Ya zhdu avtobus.", "I'm waiting for the bus."],
    ["Ты ждёшь меня?", "Ты ждёшь меня́?", "Ty zhdyosh menya?", "Are you waiting for me?"],
    ["Она ждёт ребёнка.", "Она́ ждёт ребёнка.", "Ona zhdyot rebyonka.", "She is expecting a baby."],
    ["Мы ждали час.", "Мы жда́ли час.", "My zhdali chas.", "We waited an hour."],
    ["Я подожду здесь.", "Я подожду́ здесь.", "Ya podozhdu zdes.", "I'll wait here."],

    # смотреть (to look, watch)
    ["Я смотрю фильм.", "Я смотрю́ фильм.", "Ya smotryu film.", "I'm watching a film."],
    ["Ты смотришь телевизор?", "Ты смо́тришь телеви́зор?", "Ty smotrish televizor?", "Are you watching TV?"],
    ["Он смотрит в окно.", "Он смо́трит в окно́.", "On smotrit v okno.", "He's looking out the window."],
    ["Вчера мы смотрели матч.", "Вчера́ мы смотре́ли матч.", "Vchera my smotreli match.", "Yesterday we watched the match."],
    ["Завтра я посмотрю новый эпизод.", "За́втра я посмотрю́ но́вый эпизо́д.", "Zavtra ya posmotryu novyy epizod.", "Tomorrow I'll watch the new episode."],

    # слушать (to listen)
    ["Я слушаю музыку.", "Я слу́шаю му́зыку.", "Ya slushayu muzyku.", "I'm listening to music."],
    ["Ты слушаешь меня?", "Ты слу́шаешь меня́?", "Ty slushaesh menya?", "Are you listening to me?"],
    ["Он слушает подкаст.", "Он слу́шает по́дкаст.", "On slushaet podkast.", "He's listening to a podcast."],
    ["Вчера я слушал лекцию.", "Вчера́ я слу́шал ле́кцию.", "Vchera ya slushal lektsiyu.", "Yesterday I listened to a lecture."],

    # покупать / купить
    ["Я покупаю хлеб.", "Я покупа́ю хлеб.", "Ya pokupayu khleb.", "I'm buying bread."],
    ["Ты часто покупаешь одежду?", "Ты ча́сто покупа́ешь оде́жду?", "Ty chasto pokupaesh odezhdu?", "Do you often buy clothes?"],
    ["Вчера я купил подарок.", "Вчера́ я купи́л пода́рок.", "Vchera ya kupil podarok.", "Yesterday I bought a present."],
    ["Завтра я куплю билеты.", "За́втра я куплю́ биле́ты.", "Zavtra ya kuplyu bilety.", "Tomorrow I'll buy the tickets."],

    # ехать / приехать
    ["Завтра я приеду к тебе.", "За́втра я прие́ду к тебе́.", "Zavtra ya priedu k tebe.", "Tomorrow I'll come to you."],
    ["Он приехал поздно.", "Он прие́хал по́здно.", "On priekhal pozdno.", "He arrived late."],

    # приходить / прийти
    ["Я прихожу домой в семь.", "Я прихожу́ домо́й в семь.", "Ya prikhozhu domoy v sem.", "I come home at seven."],
    ["Ты пришёл вчера?", "Ты пришёл вчера́?", "Ty prishyol vchera?", "Did you come yesterday?"],
    ["Завтра я приду пораньше.", "За́втра я приду́ пора́ньше.", "Zavtra ya pridu poranshe.", "Tomorrow I'll come earlier."],

    # звонить / позвонить
    ["Я звоню маме каждый день.", "Я звоню́ ма́ме ка́ждый день.", "Ya zvonyu mame kazhdyy den.", "I call mom every day."],
    ["Ты позвонишь мне?", "Ты позвони́шь мне?", "Ty pozvonish mne?", "Will you call me?"],
    ["Вчера он звонил два раза.", "Вчера́ он звони́л два ра́за.", "Vchera on zvonil dva raza.", "Yesterday he called twice."],

    # помогать / помочь
    ["Я помогаю другу.", "Я помога́ю дру́гу.", "Ya pomogayu drugu.", "I help my friend."],
    ["Ты поможешь мне?", "Ты помо́жешь мне?", "Ty pomozhesh mne?", "Will you help me?"],
    ["Вчера он помог мне с задачей.", "Вчера́ он помо́г мне с зада́чей.", "Vchera on pomog mne s zadachey.", "Yesterday he helped me with the task."],

    # учить / выучить
    ["Я учу новые слова.", "Я учу́ но́вые слова́.", "Ya uchu novye slova.", "I'm learning new words."],
    ["Ты учишь грамматику?", "Ты у́чишь грамма́тику?", "Ty uchish grammatiku?", "Are you learning grammar?"],
    ["Завтра я выучу стих.", "За́втра я вы́учу стих.", "Zavtra ya vyuchu stikh.", "Tomorrow I'll memorize the poem."],

    # играть
    ["Я играю на гитаре.", "Я игра́ю на гита́ре.", "Ya igrayu na gitare.", "I play the guitar."],
    ["Ты играешь в шахматы?", "Ты игра́ешь в ша́хматы?", "Ty igraesh v shakhmaty?", "Do you play chess?"],
    ["Дети играют во дворе.", "Де́ти игра́ют во дворе́.", "Deti igrayut vo dvore.", "The children are playing in the yard."],
    ["Вчера мы играли в футбол.", "Вчера́ мы игра́ли в футбо́л.", "Vchera my igrali v futbol.", "Yesterday we played football."],

    # открывать / открыть
    ["Я открываю окно.", "Я открыва́ю окно́.", "Ya otkryvayu okno.", "I'm opening the window."],
    ["Магазин открывается в девять.", "Магази́н открыва́ется в де́вять.", "Magazin otkryvaetsya v devyat.", "The store opens at nine."],
    ["Завтра я открою новый счёт.", "За́втра я откро́ю но́вый счёт.", "Zavtra ya otkroyu novyy schyot.", "Tomorrow I'll open a new account."],

    # закрывать / закрыть
    ["Я закрываю дверь.", "Я закрыва́ю дверь.", "Ya zakryvayu dver.", "I'm closing the door."],
    ["Кафе закрылось в полночь.", "Кафе́ закры́лось в по́лночь.", "Kafe zakrylos v polnoch.", "The café closed at midnight."],

    # начинать / начать
    ["Я начинаю работу в восемь.", "Я начина́ю рабо́ту в во́семь.", "Ya nachinayu rabotu v vosem.", "I start work at eight."],
    ["Вчера он начал новую книгу.", "Вчера́ он на́чал но́вую кни́гу.", "Vchera on nachal novuyu knigu.", "Yesterday he started a new book."],
    ["Завтра мы начнём проект.", "За́втра мы начнём прое́кт.", "Zavtra my nachnyom proekt.", "Tomorrow we'll start the project."],

    # заканчивать / закончить
    ["Я заканчиваю работу в шесть.", "Я зака́нчиваю рабо́ту в шесть.", "Ya zakanchivayu rabotu v shest.", "I finish work at six."],
    ["Вчера я закончил отчёт.", "Вчера́ я зако́нчил отчёт.", "Vchera ya zakonchil otchyot.", "Yesterday I finished the report."],

    # любить (continued mixed)
    ["Ты будешь любить эту книгу.", "Ты бу́дешь люби́ть э́ту кни́гу.", "Ty budesh lyubit etu knigu.", "You will love this book."],

    # рассказывать
    ["Я расскажу тебе историю.", "Я расскажу́ тебе́ исто́рию.", "Ya rasskazhu tebe istoriyu.", "I'll tell you a story."],
    ["Бабушка рассказывала сказки.", "Ба́бушка расска́зывала ска́зки.", "Babushka rasskazyvala skazki.", "Grandmother used to tell fairy tales."],

    # встречать / встретить
    ["Я встречаю гостей.", "Я встреча́ю госте́й.", "Ya vstrechayu gostey.", "I'm meeting the guests."],
    ["Завтра я встречу её в аэропорту.", "За́втра я встре́чу её в аэропорту́.", "Zavtra ya vstrechu eyo v aeroportu.", "Tomorrow I'll meet her at the airport."],
    ["Вчера мы встретились в кафе.", "Вчера́ мы встре́тились в кафе́.", "Vchera my vstretilis v kafe.", "Yesterday we met at the café."],

    # готовить
    ["Я готовлю ужин.", "Я гото́влю у́жин.", "Ya gotovlyu uzhin.", "I'm cooking dinner."],
    ["Ты готовишь сам?", "Ты гото́вишь сам?", "Ty gotovish sam?", "Do you cook yourself?"],
    ["Вчера мама готовила борщ.", "Вчера́ ма́ма гото́вила борщ.", "Vchera mama gotovila borshch.", "Yesterday mom cooked borscht."],

    # путешествовать
    ["Я путешествую каждое лето.", "Я путеше́ствую ка́ждое ле́то.", "Ya puteshestvuyu kazhdoe leto.", "I travel every summer."],
    ["Они путешествовали по Европе.", "Они́ путеше́ствовали по Евро́пе.", "Oni puteshestvovali po Evrope.", "They traveled around Europe."],
]

# ============================================================
# Helpers — multiple templates per category, rotated round-robin
# ============================================================
ADJ_NOUNS = {
    "day":      ("день",   "день",     "den",      "day"),
    "person":   ("человек","челове́к",  "chelovek", "person"),
    "house":    ("дом",    "дом",      "dom",      "house"),
    "film":     ("фильм",  "фильм",    "film",     "film"),
    "friend":   ("друг",   "друг",     "drug",     "friend"),
    "answer":   ("ответ",  "отве́т",    "otvet",    "answer"),
    "question": ("вопрос", "вопро́с",   "vopros",   "question"),
    "city":     ("город",  "го́род",    "gorod",    "city"),
}

ADJ_TEMPLATES = [
    ("Это очень {a} {n}.",
     "Э́то о́чень {as_} {ns}.",
     "Eto ochen {at} {nt}.",
     "This is a very {ae} {ne}."),
    ("Вчера я видел {a} {n}.",
     "Вчера́ я ви́дел {as_} {ns}.",
     "Vchera ya videl {at} {nt}.",
     "Yesterday I saw a {ae} {ne}."),
    ("Нам нужен {a} {n}.",
     "Нам ну́жен {as_} {ns}.",
     "Nam nuzhen {at} {nt}.",
     "We need a {ae} {ne}."),
    ("Это был действительно {a} {n}.",
     "Э́то был действи́тельно {as_} {ns}.",
     "Eto byl deystvitelno {at} {nt}.",
     "It was a really {ae} {ne}."),
]

def adj_entry(adj_ru, adj_str, adj_tr, adj_en, noun_ctx, tmpl_idx):
    n_ru, n_str, n_tr, n_en = ADJ_NOUNS[noun_ctx]
    ru_t, rs_t, tr_t, en_t = ADJ_TEMPLATES[tmpl_idx % len(ADJ_TEMPLATES)]
    return [
        ru_t.format(a=adj_ru, n=n_ru),
        rs_t.format(as_=adj_str, ns=n_str),
        tr_t.format(at=adj_tr, nt=n_tr),
        en_t.format(ae=adj_en, ne=n_en),
    ]

ADV_TEMPLATES = {
    "work":  [("Он работает {a}.","Он рабо́тает {s}.","On rabotaet {t}.","He works {e}."),
              ("Мы всегда работаем {a}.","Мы всегда́ рабо́таем {s}.","My vsegda rabotaem {t}.","We always work {e}."),
              ("Я стараюсь работать {a}.","Я стара́юсь рабо́тать {s}.","Ya starayus rabotat {t}.","I try to work {e}.")],
    "speak": [("Она говорит {a}.","Она́ говори́т {s}.","Ona govorit {t}.","She speaks {e}."),
              ("Учитель объясняет {a}.","Учи́тель объясня́ет {s}.","Uchitel obyasnyaet {t}.","The teacher explains {e}."),
              ("Постарайся ответить {a}.","Постара́йся отве́тить {s}.","Postaraysya otvetit {t}.","Try to answer {e}.")],
    "do":    [("Я делаю это {a}.","Я де́лаю э́то {s}.","Ya delayu eto {t}.","I do this {e}."),
              ("Она готовит ужин {a}.","Она́ гото́вит у́жин {s}.","Ona gotovit uzhin {t}.","She makes dinner {e}."),
              ("Они закончили задачу {a}.","Они́ зако́нчили зада́чу {s}.","Oni zakonchili zadachu {t}.","They finished the task {e}.")],
    "come":  [("Они приходят {a}.","Они́ прихо́дят {s}.","Oni prikhodyat {t}.","They come {e}."),
              ("Он опаздывает {a}.","Он опа́здывает {s}.","On opazdyvaet {t}.","He is late {e}."),
              ("Гости приехали {a}.","Го́сти прие́хали {s}.","Gosti priekhali {t}.","The guests arrived {e}.")],
    "time":  [("{a} я был дома.","{s} я был до́ма.","{t} ya byl doma.","{e} I was at home."),
              ("{a} мы ходили в кино.","{s} мы ходи́ли в кино́.","{t} my khodili v kino.","{e} we went to the cinema."),
              ("{a} начался дождь.","{s} начался́ дождь.","{t} nachalsya dozhd.","{e} it started raining.")],
    "now":   [("{a} мы заняты.","{s} мы за́няты.","{t} my zanyaty.","{e} we are busy."),
              ("{a} он позвонит.","{s} он позвони́т.","{t} on pozvonit.","{e} he will call."),
              ("{a} я хочу отдохнуть.","{s} я хочу́ отдохну́ть.","{t} ya khochu otdokhnut.","{e} I want to rest.")],
    "place": [("Книга лежит {a}.","Кни́га лежи́т {s}.","Kniga lezhit {t}.","The book lies {e}."),
              ("Машина стоит {a}.","Маши́на стои́т {s}.","Mashina stoit {t}.","The car is parked {e}."),
              ("Мы встречаемся {a}.","Мы встреча́емся {s}.","My vstrechaemsya {t}.","We meet {e}.")],
    "feel":  [("Мне {a} холодно.","Мне {s} хо́лодно.","Mne {t} kholodno.","I feel {e} cold."),
              ("Здесь {a} тихо.","Здесь {s} ти́хо.","Zdes {t} tikho.","Here it is {e} quiet."),
              ("Он {a} устал.","Он {s} уста́л.","On {t} ustal.","He is {e} tired.")],
}

def adv_entry(adv_ru, adv_str, adv_tr, adv_en, tmpl, idx):
    variants = ADV_TEMPLATES[tmpl]
    ru_t, rs_t, tr_t, en_t = variants[idx % len(variants)]
    ru = ru_t.format(a=adv_ru, s=adv_str, t=adv_tr, e=adv_en); ru = ru[0].upper() + ru[1:]
    rs = rs_t.format(a=adv_ru, s=adv_str, t=adv_tr, e=adv_en); rs = rs[0].upper() + rs[1:]
    tr = tr_t.format(a=adv_ru, s=adv_str, t=adv_tr, e=adv_en); tr = tr[0].upper() + tr[1:]
    en = en_t.format(a=adv_ru, s=adv_str, t=adv_tr, e=adv_en); en = en[0].upper() + en[1:]
    return [ru, rs, tr, en]

def _past_forms(inf_ru, inf_str, inf_tr):
    def past_cyr(s):
        if s.endswith("ться"): return s[:-4] + "лся"
        if s.endswith("ти"):   return s[:-2] + "л"
        if s.endswith("чь"):   return s[:-2] + "г"
        if s.endswith("ть"):   return s[:-2] + "л"
        return s + "л"
    def past_lat(s):
        if s.endswith("tsya"): return s[:-4] + "lsya"
        if s.endswith("ti"):   return s[:-2] + "l"
        if s.endswith("ch"):   return s[:-2] + "g"
        if s.endswith("t"):    return s[:-1] + "l"
        return s + "l"
    return past_cyr(inf_ru), past_cyr(inf_str), past_lat(inf_tr)


def _ing(en_inf):
    base = en_inf.split()[0]
    if base in ("be","see"): return base + "ing"
    if base.endswith("ie"): return base[:-2] + "ying"
    if base.endswith("e"):  return base[:-1] + "ing"
    return base + "ing"

EN_PAST = {
  "be":"was","go":"went","walk":"walked","ride":"rode","travel":"traveled",
  "read":"read","write":"wrote","speak":"spoke","listen":"listened","watch":"watched",
  "see":"saw","know":"knew","understand":"understood","think":"thought","love":"loved",
  "want":"wanted","eat":"ate","drink":"drank","sleep":"slept","live":"lived","study":"studied",
  "learn":"learned","play":"played","buy":"bought","sell":"sold","give":"gave","take":"took",
  "bring":"brought","receive":"received","arrive":"arrived","leave":"left","call":"called",
  "answer":"answered","ask":"asked","request":"requested","help":"helped","open":"opened",
  "close":"closed","begin":"began","finish":"finished","continue":"continued","search":"searched",
  "find":"found","lose":"lost","forget":"forgot","recall":"recalled","remember":"remembered",
  "repeat":"repeated","hear":"heard","feel":"felt","admire":"admired","hope":"hoped",
  "believe":"believed","smile":"smiled","laugh":"laughed","cry":"cried","fear":"feared",
  "worry":"worried","rest":"rested","cook":"cooked","clean":"cleaned","wash":"washed",
  "draw":"drew","sing":"sang","dance":"danced","run":"ran","swim":"swam","jump":"jumped",
  "sit":"sat","stand":"stood","lie":"lay","meet":"met","invite":"invited","promise":"promised",
  "advise":"advised","explain":"explained","tell":"told","compose":"composed","translate":"translated",
  "use":"used","create":"created","build":"built","break":"broke","repair":"repaired",
  "pay":"paid","cost":"cost","earn":"earned","spend":"spent","save":"saved","choose":"chose",
  "decide":"decided","plan":"planned","check":"checked","discuss":"discussed","agree":"agreed",
  "argue":"argued","apologize":"apologized","thank":"thanked","congratulate":"congratulated",
  "forgive":"forgave","tidy":"tidied","do":"did","go (on foot)":"went on foot",
}

def _past_en(en_inf):
    parts = en_inf.split(" ", 1)
    base = parts[0]; rest = (" " + parts[1]) if len(parts) > 1 else ""
    return EN_PAST.get(base, base + "ed") + rest

VERB_TEMPLATES = [
    ("Я часто {sg}.", "Я ча́сто {sgs}.", "Ya chasto {sgt}.", "I often {infe}."),
    ("Вчера я {pru}.", "Вчера́ я {prs}.", "Vchera ya {ptr}.", "Yesterday I {infe_past}."),
    ("Завтра я буду {inf}.", "За́втра я бу́ду {infs}.", "Zavtra ya budu {inft}.", "Tomorrow I will {infe}."),
    ("Я хочу {inf}.", "Я хочу́ {infs}.", "Ya khochu {inft}.", "I want to {infe}."),
    ("Сейчас я не {sg}.", "Сейча́с я не {sgs}.", "Seychas ya ne {sgt}.", "Right now I'm not {infe_ing}."),
    ("Мы должны {inf}.", "Мы должны́ {infs}.", "My dolzhny {inft}.", "We must {infe}."),
]

def verb_entry(inf_ru, inf_str, inf_tr, sg_ru, sg_str, sg_tr, en_inf, idx):
    p_ru, p_str, p_tr = _past_forms(inf_ru, inf_str, inf_tr)
    ctx = {
      "inf": inf_ru, "infs": inf_str, "inft": inf_tr,
      "infe": en_inf, "infe_ing": _ing(en_inf), "infe_past": _past_en(en_inf),
      "sg": sg_ru, "sgs": sg_str, "sgt": sg_tr,
      "pru": p_ru, "prs": p_str, "ptr": p_tr,
    }
    ru_t, rs_t, tr_t, en_t = VERB_TEMPLATES[idx % len(VERB_TEMPLATES)]
    return [ru_t.format(**ctx), rs_t.format(**ctx), tr_t.format(**ctx), en_t.format(**ctx)]


# ============================================================
# ADJECTIVES — 100 entries (masc. nom. forms with noun context)
# ============================================================
ADJECTIVES = [
    # (ru_m, ruStressed_m, translit, en_gloss, noun_ctx)
    ("хороший", "хоро́ший", "khoroshiy", "good", "day"),
    ("плохой", "плохо́й", "plokhoy", "bad", "day"),
    ("большой", "большо́й", "bolshoy", "big", "house"),
    ("маленький", "ма́ленький", "malenkiy", "small", "house"),
    ("новый", "но́вый", "novyy", "new", "film"),
    ("старый", "ста́рый", "staryy", "old", "house"),
    ("молодой", "молодо́й", "molodoy", "young", "person"),
    ("красивый", "краси́вый", "krasivyy", "beautiful", "city"),
    ("умный", "у́мный", "umnyy", "smart", "person"),
    ("глупый", "глу́пый", "glupyy", "stupid", "answer"),
    ("добрый", "до́брый", "dobryy", "kind", "person"),
    ("злой", "злой", "zloy", "angry", "person"),
    ("весёлый", "весёлый", "vesyolyy", "cheerful", "person"),
    ("грустный", "гру́стный", "grustnyy", "sad", "film"),
    ("счастливый", "счастли́вый", "schastlivyy", "happy", "person"),
    ("длинный", "дли́нный", "dlinnyy", "long", "day"),
    ("короткий", "коро́ткий", "korotkiy", "short", "answer"),
    ("высокий", "высо́кий", "vysokiy", "tall", "person"),
    ("низкий", "ни́зкий", "nizkiy", "short", "house"),
    ("широкий", "широ́кий", "shirokiy", "wide", "city"),
    ("узкий", "у́зкий", "uzkiy", "narrow", "house"),
    ("тяжёлый", "тяжёлый", "tyazhyolyy", "heavy", "day"),
    ("лёгкий", "лёгкий", "lyogkiy", "light", "question"),
    ("сильный", "си́льный", "silnyy", "strong", "person"),
    ("слабый", "сла́бый", "slabyy", "weak", "answer"),
    ("быстрый", "бы́стрый", "bystryy", "fast", "answer"),
    ("медленный", "ме́дленный", "medlennyy", "slow", "day"),
    ("горячий", "горя́чий", "goryachiy", "hot", "day"),
    ("холодный", "холо́дный", "kholodnyy", "cold", "day"),
    ("тёплый", "тёплый", "tyoplyy", "warm", "day"),
    ("свежий", "све́жий", "svezhiy", "fresh", "answer"),
    ("чистый", "чи́стый", "chistyy", "clean", "house"),
    ("грязный", "гря́зный", "gryaznyy", "dirty", "house"),
    ("дорогой", "дорого́й", "dorogoy", "expensive", "film"),
    ("дешёвый", "дешёвый", "deshyovyy", "cheap", "house"),
    ("богатый", "бога́тый", "bogatyy", "rich", "person"),
    ("бедный", "бе́дный", "bednyy", "poor", "person"),
    ("важный", "ва́жный", "vazhnyy", "important", "question"),
    ("простой", "просто́й", "prostoy", "simple", "question"),
    ("сложный", "сло́жный", "slozhnyy", "complex", "question"),
    ("трудный", "тру́дный", "trudnyy", "difficult", "question"),
    ("интересный", "интере́сный", "interesnyy", "interesting", "film"),
    ("скучный", "ску́чный", "skuchnyy", "boring", "film"),
    ("странный", "стра́нный", "strannyy", "strange", "film"),
    ("обычный", "обы́чный", "obychnyy", "ordinary", "day"),
    ("особенный", "осо́бенный", "osobennyy", "special", "day"),
    ("известный", "изве́стный", "izvestnyy", "famous", "person"),
    ("популярный", "популя́рный", "populyarnyy", "popular", "film"),
    ("ясный", "я́сный", "yasnyy", "clear", "answer"),
    ("точный", "то́чный", "tochnyy", "precise", "answer"),
    ("полный", "по́лный", "polnyy", "full", "day"),
    ("пустой", "пусто́й", "pustoy", "empty", "house"),
    ("правильный", "пра́вильный", "pravilnyy", "correct", "answer"),
    ("неправильный", "непра́вильный", "nepravilnyy", "incorrect", "answer"),
    ("настоящий", "настоя́щий", "nastoyashchiy", "real", "friend"),
    ("настоящий", "настоя́щий", "nastoyashchiy", "true", "answer"),
    ("главный", "гла́вный", "glavnyy", "main", "question"),
    ("общий", "о́бщий", "obshchiy", "common", "question"),
    ("различный", "разли́чный", "razlichnyy", "different", "answer"),
    ("одинаковый", "одина́ковый", "odinakovyy", "identical", "answer"),
    ("разный", "ра́зный", "raznyy", "various", "day"),
    ("свободный", "свобо́дный", "svobodnyy", "free", "day"),
    ("занятый", "за́нятый", "zanyatyy", "busy", "day"),
    ("открытый", "откры́тый", "otkrytyy", "open", "question"),
    ("закрытый", "закры́тый", "zakrytyy", "closed", "house"),
    ("спокойный", "споко́йный", "spokoynyy", "calm", "day"),
    ("тихий", "ти́хий", "tikhiy", "quiet", "city"),
    ("громкий", "гро́мкий", "gromkiy", "loud", "answer"),
    ("ясный", "я́сный", "yasnyy", "clear", "day"),
    ("тёмный", "тёмный", "tyomnyy", "dark", "house"),
    ("светлый", "све́тлый", "svetlyy", "bright", "house"),
    ("яркий", "я́ркий", "yarkiy", "vivid", "film"),
    ("тусклый", "ту́склый", "tusklyy", "dim", "day"),
    ("вкусный", "вку́сный", "vkusnyy", "tasty", "day"),
    ("сладкий", "сла́дкий", "sladkiy", "sweet", "day"),
    ("горький", "го́рький", "gorkiy", "bitter", "answer"),
    ("солёный", "солёный", "solyonyy", "salty", "day"),
    ("кислый", "ки́слый", "kislyy", "sour", "day"),
    ("острый", "о́стрый", "ostryy", "spicy", "question"),
    ("красный", "кра́сный", "krasnyy", "red", "house"),
    ("синий", "си́ний", "siniy", "blue", "house"),
    ("зелёный", "зелёный", "zelyonyy", "green", "city"),
    ("жёлтый", "жёлтый", "zhyoltyy", "yellow", "house"),
    ("чёрный", "чёрный", "chyornyy", "black", "film"),
    ("белый", "бе́лый", "belyy", "white", "house"),
    ("серый", "се́рый", "seryy", "grey", "day"),
    ("розовый", "ро́зовый", "rozovyy", "pink", "house"),
    ("коричневый", "кори́чневый", "korichnevyy", "brown", "house"),
    ("милый", "ми́лый", "milyy", "lovely", "friend"),
    ("прекрасный", "прекра́сный", "prekrasnyy", "wonderful", "day"),
    ("ужасный", "ужа́сный", "uzhasnyy", "terrible", "film"),
    ("страшный", "стра́шный", "strashnyy", "scary", "film"),
    ("смешной", "смешно́й", "smeshnoy", "funny", "film"),
    ("серьёзный", "серьёзный", "seryoznyy", "serious", "question"),
    ("честный", "че́стный", "chestnyy", "honest", "person"),
    ("вежливый", "ве́жливый", "vezhlivyy", "polite", "person"),
    ("грубый", "гру́бый", "grubyy", "rude", "person"),
    ("терпеливый", "терпели́вый", "terpelivyy", "patient", "person"),
    ("ленивый", "лени́вый", "lenivyy", "lazy", "person"),
    ("трудолюбивый", "трудолюби́вый", "trudolyubivyy", "hard-working", "person"),
    ("здоровый", "здоро́вый", "zdorovyy", "healthy", "person"),
    ("больной", "больно́й", "bolnoy", "sick", "person"),
    ("уставший", "уста́вший", "ustavshiy", "tired", "person"),
    ("полезный", "поле́зный", "poleznyy", "useful", "answer"),
    ("бесполезный", "бесполе́зный", "bespoleznyy", "useless", "answer"),
    ("возможный", "возмо́жный", "vozmozhnyy", "possible", "answer"),
    ("невозможный", "невозмо́жный", "nevozmozhnyy", "impossible", "answer"),
    ("современный", "совреме́нный", "sovremennyy", "modern", "city"),
    ("древний", "дре́вний", "drevniy", "ancient", "city"),
    ("свежий", "све́жий", "svezhiy", "fresh", "day"),
    ("приятный", "прия́тный", "priyatnyy", "pleasant", "day"),
    ("неприятный", "неприя́тный", "nepriyatnyy", "unpleasant", "day"),
    ("удобный", "удо́бный", "udobnyy", "comfortable", "house"),
    ("безопасный", "безопа́сный", "bezopasnyy", "safe", "city"),
    ("опасный", "опа́сный", "opasnyy", "dangerous", "city"),
    ("необычный", "необы́чный", "neobychnyy", "unusual", "day"),
    ("обычный", "обы́чный", "obychnyy", "usual", "answer"),
    ("крепкий", "кре́пкий", "krepkiy", "strong", "friend"),
    ("слабый", "сла́бый", "slabyy", "weak", "friend"),
    ("мягкий", "мя́гкий", "myagkiy", "soft", "answer"),
    ("жёсткий", "жёсткий", "zhyostkiy", "hard", "answer"),
    ("гладкий", "гла́дкий", "gladkiy", "smooth", "day"),
    ("шершавый", "шерша́вый", "shershavyy", "rough", "day"),
    ("свободный", "свобо́дный", "svobodnyy", "vacant", "house"),
    ("женатый", "жена́тый", "zhenatyy", "married", "friend"),
    ("одинокий", "одино́кий", "odinokiy", "lonely", "person"),
    ("дружелюбный", "дружелю́бный", "druzhelyubnyy", "friendly", "person"),
    ("враждебный", "вражде́бный", "vrazhdebnyy", "hostile", "city"),
    ("надёжный", "надёжный", "nadyozhnyy", "reliable", "friend"),
    ("ненадёжный", "ненадёжный", "nenadyozhnyy", "unreliable", "friend"),
    ("гордый", "го́рдый", "gordyy", "proud", "person"),
    ("скромный", "скро́мный", "skromnyy", "modest", "person"),
    ("смелый", "сме́лый", "smelyy", "brave", "person"),
    ("трусливый", "трусли́вый", "truslivyy", "cowardly", "person"),
    ("спортивный", "спорти́вный", "sportivnyy", "athletic", "person"),
    ("творческий", "тво́рческий", "tvorcheskiy", "creative", "person"),
    ("активный", "акти́вный", "aktivnyy", "active", "day"),
    ("пассивный", "пасси́вный", "passivnyy", "passive", "person"),
    ("вкусный", "вку́сный", "vkusnyy", "delicious", "answer"),
    ("свободный", "свобо́дный", "svobodnyy", "free", "answer"),
    ("гениальный", "гениа́льный", "genialnyy", "brilliant", "answer"),
    ("обыкновенный", "обыкнове́нный", "obyknovennyy", "ordinary", "person"),
    ("вежливый", "ве́жливый", "vezhlivyy", "courteous", "friend"),
    ("умелый", "уме́лый", "umelyy", "skilled", "person"),
    ("неумелый", "неуме́лый", "neumelyy", "unskilled", "person"),
    ("образованный", "образо́ванный", "obrazovannyy", "educated", "person"),
    ("необразованный", "необразо́ванный", "neobrazovannyy", "uneducated", "person"),
    ("опытный", "о́пытный", "opytnyy", "experienced", "person"),
    ("неопытный", "нео́пытный", "neopytnyy", "inexperienced", "person"),
    ("осторожный", "осторо́жный", "ostorozhnyy", "cautious", "person"),
    ("любопытный", "любопы́тный", "lyubopytnyy", "curious", "person"),
    ("равнодушный", "равноду́шный", "ravnodushnyy", "indifferent", "person"),
    ("заботливый", "забо́тливый", "zabotlivyy", "caring", "friend"),
    ("щедрый", "ще́дрый", "shchedryy", "generous", "person"),
    ("жадный", "жа́дный", "zhadnyy", "greedy", "person"),
    ("гостеприимный", "гостеприи́мный", "gostepriimnyy", "hospitable", "person"),
    ("упрямый", "упря́мый", "upryamyy", "stubborn", "person"),
    ("гибкий", "ги́бкий", "gibkiy", "flexible", "answer"),
    ("строгий", "стро́гий", "strogiy", "strict", "person"),
]

# ============================================================
# ADVERBS — 100 entries
# ============================================================
ADVERBS = [
    # (ru, ruStressed, translit, en_gloss, template)
    ("быстро", "бы́стро", "bystro", "quickly", "work"),
    ("медленно", "ме́дленно", "medlenno", "slowly", "work"),
    ("хорошо", "хорошо́", "khorosho", "well", "work"),
    ("плохо", "пло́хо", "plokho", "poorly", "work"),
    ("тихо", "ти́хо", "tikho", "quietly", "speak"),
    ("громко", "гро́мко", "gromko", "loudly", "speak"),
    ("чётко", "чётко", "chyotko", "clearly", "speak"),
    ("ясно", "я́сно", "yasno", "clearly", "speak"),
    ("часто", "ча́сто", "chasto", "often", "come"),
    ("редко", "ре́дко", "redko", "rarely", "come"),
    ("иногда", "иногда́", "inogda", "sometimes", "come"),
    ("всегда", "всегда́", "vsegda", "always", "come"),
    ("никогда", "никогда́", "nikogda", "never", "come"),
    ("сегодня", "сего́дня", "segodnya", "today", "time"),
    ("вчера", "вчера́", "vchera", "yesterday", "time"),
    ("завтра", "за́втра", "zavtra", "tomorrow", "now"),
    ("сейчас", "сейча́с", "seychas", "now", "now"),
    ("потом", "пото́м", "potom", "later", "now"),
    ("рано", "ра́но", "rano", "early", "come"),
    ("поздно", "по́здно", "pozdno", "late", "come"),
    ("уже", "уже́", "uzhe", "already", "now"),
    ("ещё", "ещё", "eshchyo", "still", "now"),
    ("скоро", "ско́ро", "skoro", "soon", "now"),
    ("давно", "давно́", "davno", "long ago", "time"),
    ("недавно", "неда́вно", "nedavno", "recently", "time"),
    ("здесь", "здесь", "zdes", "here", "place"),
    ("там", "там", "tam", "there", "place"),
    ("везде", "везде́", "vezde", "everywhere", "place"),
    ("нигде", "нигде́", "nigde", "nowhere", "place"),
    ("дома", "до́ма", "doma", "at home", "place"),
    ("снаружи", "снару́жи", "snaruzhi", "outside", "place"),
    ("внутри", "внутри́", "vnutri", "inside", "place"),
    ("наверху", "наверху́", "naverkhu", "above", "place"),
    ("внизу", "внизу́", "vnizu", "below", "place"),
    ("впереди", "впереди́", "vperedi", "ahead", "place"),
    ("сзади", "сза́ди", "szadi", "behind", "place"),
    ("слева", "сле́ва", "sleva", "on the left", "place"),
    ("справа", "спра́ва", "sprava", "on the right", "place"),
    ("очень", "о́чень", "ochen", "very", "feel"),
    ("слишком", "сли́шком", "slishkom", "too", "feel"),
    ("немного", "немно́го", "nemnogo", "a little", "feel"),
    ("совсем", "совсе́м", "sovsem", "completely", "feel"),
    ("почти", "почти́", "pochti", "almost", "feel"),
    ("точно", "то́чно", "tochno", "exactly", "speak"),
    ("неточно", "нето́чно", "netochno", "inexactly", "speak"),
    ("правильно", "пра́вильно", "pravilno", "correctly", "do"),
    ("неправильно", "непра́вильно", "nepravilno", "incorrectly", "do"),
    ("осторожно", "осторо́жно", "ostorozhno", "carefully", "do"),
    ("аккуратно", "аккура́тно", "akkuratno", "neatly", "do"),
    ("вместе", "вме́сте", "vmeste", "together", "work"),
    ("отдельно", "отде́льно", "otdelno", "separately", "work"),
    ("одиноко", "одино́ко", "odinoko", "lonely", "feel"),
    ("свободно", "свобо́дно", "svobodno", "freely", "speak"),
    ("серьёзно", "серьёзно", "seryozno", "seriously", "speak"),
    ("шутя", "шутя́", "shutya", "jokingly", "speak"),
    ("честно", "че́стно", "chestno", "honestly", "speak"),
    ("открыто", "откры́то", "otkryto", "openly", "speak"),
    ("тайно", "та́йно", "tayno", "secretly", "do"),
    ("вежливо", "ве́жливо", "vezhlivo", "politely", "speak"),
    ("грубо", "гру́бо", "grubo", "rudely", "speak"),
    ("ласково", "ла́сково", "laskovo", "tenderly", "speak"),
    ("строго", "стро́го", "strogo", "strictly", "speak"),
    ("спокойно", "споко́йно", "spokoyno", "calmly", "speak"),
    ("нервно", "не́рвно", "nervno", "nervously", "speak"),
    ("уверенно", "уве́ренно", "uverenno", "confidently", "speak"),
    ("сомнительно", "сомни́тельно", "somnitelno", "doubtfully", "speak"),
    ("охотно", "охо́тно", "okhotno", "willingly", "work"),
    ("неохотно", "неохо́тно", "neokhotno", "unwillingly", "work"),
    ("легко", "легко́", "legko", "easily", "do"),
    ("трудно", "тру́дно", "trudno", "with difficulty", "do"),
    ("успешно", "успе́шно", "uspeshno", "successfully", "work"),
    ("неудачно", "неуда́чно", "neudachno", "unsuccessfully", "work"),
    ("красиво", "краси́во", "krasivo", "beautifully", "do"),
    ("ужасно", "ужа́сно", "uzhasno", "terribly", "feel"),
    ("прекрасно", "прекра́сно", "prekrasno", "wonderfully", "feel"),
    ("странно", "стра́нно", "stranno", "strangely", "speak"),
    ("обычно", "обы́чно", "obychno", "usually", "come"),
    ("необычно", "необы́чно", "neobychno", "unusually", "speak"),
    ("просто", "про́сто", "prosto", "simply", "do"),
    ("сложно", "сло́жно", "slozhno", "complicatedly", "do"),
    ("важно", "ва́жно", "vazhno", "importantly", "speak"),
    ("прямо", "пря́мо", "pryamo", "straight", "speak"),
    ("косвенно", "ко́свенно", "kosvenno", "indirectly", "speak"),
    ("полностью", "по́лностью", "polnostyu", "completely", "do"),
    ("частично", "части́чно", "chastichno", "partially", "do"),
    ("абсолютно", "абсолю́тно", "absolyutno", "absolutely", "feel"),
    ("относительно", "относи́тельно", "otnositelno", "relatively", "speak"),
    ("обязательно", "обяза́тельно", "obyazatelno", "definitely", "come"),
    ("возможно", "возмо́жно", "vozmozhno", "possibly", "come"),
    ("вероятно", "вероя́тно", "veroyatno", "probably", "come"),
    ("естественно", "есте́ственно", "estestvenno", "naturally", "speak"),
    ("неожиданно", "неожи́данно", "neozhidanno", "unexpectedly", "come"),
    ("случайно", "случа́йно", "sluchayno", "by chance", "come"),
    ("специально", "специа́льно", "spetsialno", "specially", "do"),
    ("нарочно", "наро́чно", "narochno", "on purpose", "do"),
    ("вдвоём", "вдвоём", "vdvoyom", "as a pair", "work"),
    ("вместе", "вме́сте", "vmeste", "together", "come"),
    ("отдельно", "отде́льно", "otdelno", "separately", "come"),
    ("вдруг", "вдруг", "vdrug", "suddenly", "come"),
    ("постепенно", "постепе́нно", "postepenno", "gradually", "do"),
    ("долго", "до́лго", "dolgo", "for a long time", "work"),
    ("коротко", "ко́ротко", "korotko", "briefly", "speak"),
    ("полностью", "по́лностью", "polnostyu", "fully", "speak"),
]

# ============================================================
# VERBS — 100 entries (most common verbs, 1sg present + infinitive gloss)
# ============================================================
VERBS = [
    # (inf_ru, inf_str, inf_tr, sg1_ru, sg1_str, sg1_tr, en_inf)
    ("работать", "рабо́тать", "rabotat", "работаю", "рабо́таю", "rabotayu", "work"),
    ("делать", "де́лать", "delat", "делаю", "де́лаю", "delayu", "do"),
    ("идти", "идти́", "idti", "иду", "иду́", "idu", "walk"),
    ("ходить", "ходи́ть", "khodit", "хожу", "хожу́", "khozhu", "go (on foot)"),
    ("ехать", "е́хать", "ekhat", "еду", "е́ду", "edu", "ride"),
    ("ездить", "е́здить", "ezdit", "езжу", "е́зжу", "ezzhu", "travel"),
    ("читать", "чита́ть", "chitat", "читаю", "чита́ю", "chitayu", "read"),
    ("писать", "писа́ть", "pisat", "пишу", "пишу́", "pishu", "write"),
    ("говорить", "говори́ть", "govorit", "говорю", "говорю́", "govoryu", "speak"),
    ("слушать", "слу́шать", "slushat", "слушаю", "слу́шаю", "slushayu", "listen"),
    ("смотреть", "смотре́ть", "smotret", "смотрю", "смотрю́", "smotryu", "watch"),
    ("видеть", "ви́деть", "videt", "вижу", "ви́жу", "vizhu", "see"),
    ("знать", "знать", "znat", "знаю", "зна́ю", "znayu", "know"),
    ("понимать", "понима́ть", "ponimat", "понимаю", "понима́ю", "ponimayu", "understand"),
    ("думать", "ду́мать", "dumat", "думаю", "ду́маю", "dumayu", "think"),
    ("любить", "люби́ть", "lyubit", "люблю", "люблю́", "lyublyu", "love"),
    ("хотеть", "хоте́ть", "khotet", "хочу", "хочу́", "khochu", "want"),
    ("мочь", "мочь", "moch", "могу", "могу́", "mogu", "be able"),
    ("есть", "есть", "est", "ем", "ем", "em", "eat"),
    ("пить", "пить", "pit", "пью", "пью", "pyu", "drink"),
    ("спать", "спать", "spat", "сплю", "сплю", "splyu", "sleep"),
    ("жить", "жить", "zhit", "живу", "живу́", "zhivu", "live"),
    ("учить", "учи́ть", "uchit", "учу", "учу́", "uchu", "study"),
    ("учиться", "учи́ться", "uchitsya", "учусь", "учу́сь", "uchus", "learn"),
    ("играть", "игра́ть", "igrat", "играю", "игра́ю", "igrayu", "play"),
    ("покупать", "покупа́ть", "pokupat", "покупаю", "покупа́ю", "pokupayu", "buy"),
    ("продавать", "продава́ть", "prodavat", "продаю", "продаю́", "prodayu", "sell"),
    ("давать", "дава́ть", "davat", "даю", "даю́", "dayu", "give"),
    ("брать", "брать", "brat", "беру", "беру́", "beru", "take"),
    ("приносить", "приноси́ть", "prinosit", "приношу", "приношу́", "prinoshu", "bring"),
    ("получать", "получа́ть", "poluchat", "получаю", "получа́ю", "poluchayu", "receive"),
    ("отдавать", "отдава́ть", "otdavat", "отдаю", "отдаю́", "otdayu", "give back"),
    ("приходить", "приходи́ть", "prikhodit", "прихожу", "прихожу́", "prikhozhu", "arrive (on foot)"),
    ("приезжать", "приезжа́ть", "priezzhat", "приезжаю", "приезжа́ю", "priezzhayu", "arrive (by vehicle)"),
    ("уходить", "уходи́ть", "ukhodit", "ухожу", "ухожу́", "ukhozhu", "leave (on foot)"),
    ("уезжать", "уезжа́ть", "uezzhat", "уезжаю", "уезжа́ю", "uezzhayu", "leave (by vehicle)"),
    ("звонить", "звони́ть", "zvonit", "звоню", "звоню́", "zvonyu", "call"),
    ("отвечать", "отвеча́ть", "otvechat", "отвечаю", "отвеча́ю", "otvechayu", "answer"),
    ("спрашивать", "спра́шивать", "sprashivat", "спрашиваю", "спра́шиваю", "sprashivayu", "ask"),
    ("просить", "проси́ть", "prosit", "прошу", "прошу́", "proshu", "request"),
    ("помогать", "помога́ть", "pomogat", "помогаю", "помога́ю", "pomogayu", "help"),
    ("открывать", "открыва́ть", "otkryvat", "открываю", "открыва́ю", "otkryvayu", "open"),
    ("закрывать", "закрыва́ть", "zakryvat", "закрываю", "закрыва́ю", "zakryvayu", "close"),
    ("начинать", "начина́ть", "nachinat", "начинаю", "начина́ю", "nachinayu", "begin"),
    ("заканчивать", "зака́нчивать", "zakanchivat", "заканчиваю", "зака́нчиваю", "zakanchivayu", "finish"),
    ("продолжать", "продолжа́ть", "prodolzhat", "продолжаю", "продолжа́ю", "prodolzhayu", "continue"),
    ("искать", "иска́ть", "iskat", "ищу", "ищу́", "ishchu", "search for"),
    ("находить", "находи́ть", "nakhodit", "нахожу", "нахожу́", "nakhozhu", "find"),
    ("терять", "теря́ть", "teryat", "теряю", "теря́ю", "teryayu", "lose"),
    ("забывать", "забыва́ть", "zabyvat", "забываю", "забыва́ю", "zabyvayu", "forget"),
    ("вспоминать", "вспомина́ть", "vspominat", "вспоминаю", "вспомина́ю", "vspominayu", "recall"),
    ("помнить", "по́мнить", "pomnit", "помню", "по́мню", "pomnyu", "remember"),
    ("учить", "учи́ть", "uchit", "учу", "учу́", "uchu", "learn"),
    ("повторять", "повторя́ть", "povtoryat", "повторяю", "повторя́ю", "povtoryayu", "repeat"),
    ("слышать", "слы́шать", "slyshat", "слышу", "слы́шу", "slyshu", "hear"),
    ("чувствовать", "чу́вствовать", "chuvstvovat", "чувствую", "чу́вствую", "chuvstvuyu", "feel"),
    ("любоваться", "любова́ться", "lyubovatsya", "любуюсь", "любу́юсь", "lyubuyus", "admire"),
    ("надеяться", "наде́яться", "nadeyatsya", "надеюсь", "наде́юсь", "nadeyus", "hope"),
    ("верить", "ве́рить", "verit", "верю", "ве́рю", "veryu", "believe"),
    ("улыбаться", "улыба́ться", "ulybatsya", "улыбаюсь", "улыба́юсь", "ulybayus", "smile"),
    ("смеяться", "смея́ться", "smeyatsya", "смеюсь", "смею́сь", "smeyus", "laugh"),
    ("плакать", "пла́кать", "plakat", "плачу", "пла́чу", "plachu", "cry"),
    ("бояться", "боя́ться", "boyatsya", "боюсь", "бою́сь", "boyus", "fear"),
    ("волноваться", "волнова́ться", "volnovatsya", "волнуюсь", "волну́юсь", "volnuyus", "worry"),
    ("отдыхать", "отдыха́ть", "otdykhat", "отдыхаю", "отдыха́ю", "otdykhayu", "rest"),
    ("гулять", "гуля́ть", "gulyat", "гуляю", "гуля́ю", "gulyayu", "go for a walk"),
    ("путешествовать", "путеше́ствовать", "puteshestvovat", "путешествую", "путеше́ствую", "puteshestvuyu", "travel"),
    ("готовить", "гото́вить", "gotovit", "готовлю", "гото́влю", "gotovlyu", "cook"),
    ("убирать", "убира́ть", "ubirat", "убираю", "убира́ю", "ubirayu", "tidy up"),
    ("стирать", "стира́ть", "stirat", "стираю", "стира́ю", "stirayu", "do laundry"),
    ("мыть", "мыть", "myt", "мою", "мо́ю", "moyu", "wash"),
    ("рисовать", "рисова́ть", "risovat", "рисую", "рису́ю", "risuyu", "draw"),
    ("петь", "петь", "pet", "пою", "пою́", "poyu", "sing"),
    ("танцевать", "танцева́ть", "tantsevat", "танцую", "танцу́ю", "tantsuyu", "dance"),
    ("бегать", "бе́гать", "begat", "бегаю", "бе́гаю", "begayu", "run"),
    ("плавать", "пла́вать", "plavat", "плаваю", "пла́ваю", "plavayu", "swim"),
    ("прыгать", "пры́гать", "prygat", "прыгаю", "пры́гаю", "prygayu", "jump"),
    ("сидеть", "сиде́ть", "sidet", "сижу", "сижу́", "sizhu", "sit"),
    ("стоять", "стоя́ть", "stoyat", "стою", "стою́", "stoyu", "stand"),
    ("лежать", "лежа́ть", "lezhat", "лежу", "лежу́", "lezhu", "lie"),
    ("встречать", "встреча́ть", "vstrechat", "встречаю", "встреча́ю", "vstrechayu", "meet"),
    ("приглашать", "приглаша́ть", "priglashat", "приглашаю", "приглаша́ю", "priglashayu", "invite"),
    ("дарить", "дари́ть", "darit", "дарю", "дарю́", "daryu", "give as gift"),
    ("обещать", "обеща́ть", "obeshchat", "обещаю", "обеща́ю", "obeshchayu", "promise"),
    ("советовать", "сове́товать", "sovetovat", "советую", "сове́тую", "sovetuyu", "advise"),
    ("объяснять", "объясня́ть", "obyasnyat", "объясняю", "объясня́ю", "obyasnyayu", "explain"),
    ("рассказывать", "расска́зывать", "rasskazyvat", "рассказываю", "расска́зываю", "rasskazyvayu", "tell"),
    ("писать", "писа́ть", "pisat", "пишу", "пишу́", "pishu", "compose"),
    ("переводить", "переводи́ть", "perevodit", "перевожу", "перевожу́", "perevozhu", "translate"),
    ("использовать", "испо́льзовать", "ispolzovat", "использую", "испо́льзую", "ispolzuyu", "use"),
    ("создавать", "создава́ть", "sozdavat", "создаю", "создаю́", "sozdayu", "create"),
    ("строить", "стро́ить", "stroit", "строю", "стро́ю", "stroyu", "build"),
    ("ломать", "лома́ть", "lomat", "ломаю", "лома́ю", "lomayu", "break"),
    ("чинить", "чини́ть", "chinit", "чиню", "чиню́", "chinyu", "repair"),
    ("платить", "плати́ть", "platit", "плачу", "плачу́", "plachu", "pay"),
    ("стоить", "сто́ить", "stoit", "стою", "сто́ю", "stoyu", "cost"),
    ("зарабатывать", "зараба́тывать", "zarabatyvat", "зарабатываю", "зараба́тываю", "zarabatyvayu", "earn"),
    ("тратить", "тра́тить", "tratit", "трачу", "тра́чу", "trachu", "spend"),
    ("экономить", "эконо́мить", "ekonomit", "экономлю", "эконо́млю", "ekonomlyu", "save"),
    ("выбирать", "выбира́ть", "vybirat", "выбираю", "выбира́ю", "vybirayu", "choose"),
    ("решать", "реша́ть", "reshat", "решаю", "реша́ю", "reshayu", "decide"),
    ("планировать", "плани́ровать", "planirovat", "планирую", "плани́рую", "planiruyu", "plan"),
    ("проверять", "проверя́ть", "proveryat", "проверяю", "проверя́ю", "proveryayu", "check"),
    ("повторять", "повторя́ть", "povtoryat", "повторяю", "повторя́ю", "povtoryayu", "repeat"),
    ("обсуждать", "обсужда́ть", "obsuzhdat", "обсуждаю", "обсужда́ю", "obsuzhdayu", "discuss"),
    ("соглашаться", "соглаша́ться", "soglashatsya", "соглашаюсь", "соглаша́юсь", "soglashayus", "agree"),
    ("спорить", "спо́рить", "sporit", "спорю", "спо́рю", "sporyu", "argue"),
    ("извиняться", "извиня́ться", "izvinyatsya", "извиняюсь", "извиня́юсь", "izvinyayus", "apologize"),
    ("благодарить", "благодари́ть", "blagodarit", "благодарю", "благодарю́", "blagodaryu", "thank"),
    ("поздравлять", "поздравля́ть", "pozdravlyat", "поздравляю", "поздравля́ю", "pozdravlyayu", "congratulate"),
    ("прощать", "проща́ть", "proshchat", "прощаю", "проща́ю", "proshchayu", "forgive"),
]

# ============================================================
# Build & write
# ============================================================
def write_part(key, rows):
    out = []
    for i, r in enumerate(rows, 1):
        out.append({
            "id": f"{key}-{i}",
            "ru": r[0], "ruStressed": r[1], "translit": r[2], "en": r[3],
        })
    path = os.path.join(OUT, f"{key}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"wrote {path}: {len(out)}")

TARGET = 300

def build_to_target(vocab, fn, target=TARGET):
    """Rotate over vocab × template index until we hit `target` unique rows."""
    rows, seen, i = [], set(), 0
    while len(rows) < target:
        v = vocab[i % len(vocab)]
        tmpl_idx = i // len(vocab)
        r = fn(v, tmpl_idx)
        key = r[0]
        if key not in seen:
            seen.add(key); rows.append(r)
        i += 1
        if i > len(vocab) * 20:  # safety
            break
    return rows[:target]

adj_rows  = build_to_target(ADJECTIVES, lambda v, ti: adj_entry(v[0], v[1], v[2], v[3], v[4], ti))
adv_rows  = build_to_target(ADVERBS,    lambda v, ti: adv_entry(v[0], v[1], v[2], v[3], v[4], ti))
verb_rows = build_to_target(VERBS,      lambda v, ti: verb_entry(v[0], v[1], v[2], v[3], v[4], v[5], v[6], ti))

write_part("basic-verb-conjugations", CONJ)
write_part("top-300-adjectives", adj_rows)
write_part("top-300-adverbs", adv_rows)
write_part("top-300-verbs", verb_rows)


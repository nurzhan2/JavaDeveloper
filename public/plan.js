// План: 24 недели, старт по умолчанию — понедельник 5 октября 2026.
// LeetCode: [номер, slug, сложность E/M/H]. ID задач стабильны — не меняй их, иначе прогресс потеряется.

window.PLAN = {
  defaultStart: "2026-10-05",
  phases: [
    { id: 1, name: "Java Core", color: "#F2A541", weeks: [1, 4] },
    { id: 2, name: "Многопоточность", color: "#FF7A59", weeks: [5, 7] },
    { id: 3, name: "SQL и базы данных", color: "#5BC0EB", weeks: [8, 11] },
    { id: 4, name: "Spring Boot", color: "#3DD6A3", weeks: [12, 15] },
    { id: 5, name: "Security, Docker, CI", color: "#B388FF", weeks: [16, 17] },
    { id: 6, name: "Kafka, Redis, микросервисы", color: "#FF5C8A", weeks: [18, 21] },
    { id: 7, name: "Собеседования и отклики", color: "#F1453D", weeks: [22, 24] }
  ],
  weeks: [
    { n: 1, title: "ООП и строки", goal: "Писать классы, интерфейсы и работу со строками без подсказок",
      theory: ["Классы, инкапсуляция, наследование, полиморфизм", "Интерфейсы vs абстрактные классы, default-методы", "String, StringBuilder, неизменяемость, String pool", "Контракт equals и hashCode", "Исключения: checked vs unchecked, try-with-resources"],
      lc: [[217,"contains-duplicate","E"],[242,"valid-anagram","E"],[49,"group-anagrams","M"],[347,"top-k-frequent-elements","M"],[125,"valid-palindrome","E"],[167,"two-sum-ii-input-array-is-sorted","M"],[121,"best-time-to-buy-and-sell-stock","E"]],
      project: "Создать репо java-core-notes: по папке на тему, в каждой пример кода + 3 ключевых слова" },
    { n: 2, title: "Коллекции изнутри", goal: "Объяснить, как устроен HashMap, и выбрать нужную коллекцию под задачу",
      theory: ["ArrayList vs LinkedList: сложность операций", "HashMap изнутри: бакеты, коллизии, resize, treeify", "HashSet, TreeMap, LinkedHashMap — когда что", "Comparable и Comparator", "Iterator, fail-fast, ConcurrentModificationException"],
      lc: [[238,"product-of-array-except-self","M"],[36,"valid-sudoku","M"],[128,"longest-consecutive-sequence","M"],[15,"3sum","M"],[11,"container-with-most-water","M"],[424,"longest-repeating-character-replacement","M"],[567,"permutation-in-string","M"]],
      project: "Написать свой MyHashMap: put, get, remove, resize + проверки в main" },
    { n: 3, title: "Generics и Stream API", goal: "Решать задачи на обработку данных через Stream API в одну цепочку",
      theory: ["Generics, стирание типов, wildcards и PECS", "Функциональные интерфейсы и лямбды", "Stream API: map, filter, reduce, collect", "Collectors.groupingBy, partitioningBy, toMap", "Optional: как и когда использовать"],
      lc: [[20,"valid-parentheses","E"],[155,"min-stack","M"],[150,"evaluate-reverse-polish-notation","M"],[739,"daily-temperatures","M"],[853,"car-fleet","M"],[42,"trapping-rain-water","H"],[76,"minimum-window-substring","H"]],
      project: "Консольный трекер расходов: чтение CSV, группировка по категориям через Stream API" },
    { n: 4, title: "JVM и современная Java", goal: "Рассказать про память JVM и фичи Java 17/21 на собеседовании",
      theory: ["Stack vs Heap, что где лежит", "Сборщик мусора: поколения, G1 в общих чертах", "Classloader, JIT, байткод", "Java 17: records, sealed, switch-выражения, text blocks", "Java 21: virtual threads, pattern matching"],
      lc: [[704,"binary-search","E"],[74,"search-a-2d-matrix","M"],[875,"koko-eating-bananas","M"],[153,"find-minimum-in-rotated-sorted-array","M"],[33,"search-in-rotated-sorted-array","M"],[981,"time-based-key-value-store","M"],[239,"sliding-window-maximum","H"]],
      project: "Итог фазы: README в java-core-notes + 20 вопросов собеседования по Java Core с ответами" },

    { n: 5, title: "Потоки и синхронизация", goal: "Найти и исправить race condition в своём коде",
      theory: ["Thread, Runnable, жизненный цикл потока", "synchronized и монитор объекта", "volatile и happens-before", "wait / notify", "Deadlock, livelock, race condition"],
      lc: [[206,"reverse-linked-list","E"],[21,"merge-two-sorted-lists","E"],[143,"reorder-list","M"],[19,"remove-nth-node-from-end-of-list","M"],[1114,"print-in-order","E"],[1115,"print-foobar-alternately","M"],[141,"linked-list-cycle","E"]],
      project: "Симулятор переводов: 100 потоков переводят деньги между счетами — поймать и починить гонку" },
    { n: 6, title: "java.util.concurrent", goal: "Писать многопоточный код через пулы и атомики, а не голые потоки",
      theory: ["ExecutorService и пулы потоков", "Callable, Future", "ReentrantLock, ReadWriteLock", "Atomic-классы и CAS", "ConcurrentHashMap изнутри"],
      lc: [[138,"copy-list-with-random-pointer","M"],[287,"find-the-duplicate-number","M"],[146,"lru-cache","M"],[1116,"print-zero-even-odd","M"],[1117,"building-h2o","M"],[23,"merge-k-sorted-lists","H"]],
      project: "Переписать симулятор на ExecutorService + AtomicLong / ReentrantLock, сравнить скорость" },
    { n: 7, title: "Координация потоков", goal: "Уверенно отвечать на вопросы по многопоточности",
      theory: ["CompletableFuture: цепочки и комбинация", "CountDownLatch, Semaphore, CyclicBarrier", "BlockingQueue и producer-consumer", "Virtual threads на практике", "Повтор: 15 вопросов собеса по многопоточности"],
      lc: [[1195,"fizz-buzz-multithreaded","M"],[1226,"the-dining-philosophers","M"],[226,"invert-binary-tree","E"],[104,"maximum-depth-of-binary-tree","E"],[543,"diameter-of-binary-tree","E"],[110,"balanced-binary-tree","E"],[100,"same-tree","E"]],
      project: "Очередь заказов: producer-consumer на BlockingQueue с несколькими обработчиками" },

    { n: 8, title: "SQL с нуля", goal: "Писать запросы с JOIN и GROUP BY без подсказок",
      theory: ["SELECT, WHERE, ORDER BY, LIMIT", "JOIN: inner, left, right, self join", "GROUP BY, HAVING, агрегаты", "Подзапросы и CTE (WITH)", "Оконные функции: ROW_NUMBER, RANK, SUM OVER"],
      lc: [[1757,"recyclable-and-low-fat-products","E"],[584,"find-customer-referee","E"],[595,"big-countries","E"],[1148,"article-views-i","E"],[1683,"invalid-tweets","E"],[1378,"replace-employee-id-with-the-unique-identifier","E"],[1068,"product-sales-analysis-i","E"],[1581,"customer-who-visited-but-did-not-make-any-transactions","E"],[197,"rising-temperature","E"],[1661,"average-time-of-process-per-machine","E"]],
      project: "Поднять PostgreSQL в Docker, спроектировать схему банка: users, accounts, transactions" },
    { n: 9, title: "Транзакции и индексы", goal: "Объяснить уровни изоляции и показать lost update вживую",
      theory: ["Индексы B-tree, EXPLAIN ANALYZE", "ACID", "Уровни изоляции и аномалии", "Блокировки, SELECT FOR UPDATE", "Нормализация: 1НФ, 2НФ, 3НФ"],
      lc: [[577,"employee-bonus","E"],[1280,"students-and-examinations","E"],[570,"managers-with-at-least-5-direct-reports","M"],[1934,"confirmation-rate","M"],[620,"not-boring-movies","E"],[1251,"average-selling-price","E"],[572,"subtree-of-another-tree","E"],[235,"lowest-common-ancestor-of-a-binary-search-tree","M"]],
      project: "В двух окнах psql сделать параллельные переводы, увидеть lost update и починить через FOR UPDATE" },
    { n: 10, title: "JDBC и Hibernate", goal: "Понимать, что Hibernate делает с базой под капотом",
      theory: ["JDBC, PreparedStatement, SQL-инъекции", "JPA: Entity, связи OneToMany / ManyToOne", "Lazy vs Eager, проблема N+1", "Persistence context, dirty checking", "Повтор SQL: 10 вопросов собеса"],
      lc: [[1193,"monthly-transactions-i","M"],[1174,"immediate-food-delivery-ii","M"],[550,"game-play-analysis-iv","M"],[180,"consecutive-numbers","M"],[176,"second-highest-salary","M"],[184,"department-highest-salary","M"],[102,"binary-tree-level-order-traversal","M"],[199,"binary-tree-right-side-view","M"]],
      project: "Консольное приложение на JDBC к схеме банка: создать счёт, перевести, показать историю" },
    { n: 11, title: "Лёгкая неделя: сессия", goal: "Сдать экзамены и не потерять форму", light: true,
      theory: ["Повтор: коллекции", "Повтор: многопоточность", "Повтор: SQL", "Повтор: Java Core вопросы", "Отдых"],
      lc: [[98,"validate-binary-search-tree","M"],[230,"kth-smallest-element-in-a-bst","M"],[1448,"count-good-nodes-in-binary-tree","M"]],
      project: "Без проекта. Если сессия в другие даты — сдвинь план в настройках" },

    { n: 12, title: "Spring Core", goal: "Объяснить IoC и DI и запустить первый Spring Boot проект",
      theory: ["IoC и Dependency Injection", "Бины: scope и жизненный цикл", "@Component, @Configuration, @Bean", "Автоконфигурация и стартеры Spring Boot", "application.yml и профили"],
      lc: [[208,"implement-trie-prefix-tree","M"],[211,"design-add-and-search-words-data-structure","M"],[703,"kth-largest-element-in-a-stream","E"],[1046,"last-stone-weight","E"],[973,"k-closest-points-to-origin","M"]],
      project: "Проект 1 «pay-lite»: Spring Initializr, структура пакетов, /health, репо на GitHub" },
    { n: 13, title: "Spring Web и REST", goal: "Сделать чистое REST API с валидацией и обработкой ошибок",
      theory: ["REST-контроллеры, @RestController", "DTO и валидация (@Valid)", "Ошибки: @ControllerAdvice", "HTTP-коды и дизайн REST", "Swagger / OpenAPI"],
      lc: [[215,"kth-largest-element-in-an-array","M"],[621,"task-scheduler","M"],[355,"design-twitter","M"],[295,"find-median-from-data-stream","H"]],
      project: "pay-lite: API пользователей и счетов + Swagger" },
    { n: 14, title: "Spring Data JPA", goal: "Сделать надёжный перевод денег: транзакция, блокировка, идемпотентность",
      theory: ["Spring Data репозитории и запросы", "@Transactional и propagation", "Оптимистичная блокировка @Version", "Миграции Flyway", "Пагинация и сортировка"],
      lc: [[78,"subsets","M"],[39,"combination-sum","M"],[46,"permutations","M"],[90,"subsets-ii","M"],[40,"combination-sum-ii","M"]],
      project: "pay-lite: переводы между счетами с блокировкой и Idempotency-Key" },
    { n: 15, title: "Тестирование", goal: "Покрыть проект тестами, включая тест на конкурентность",
      theory: ["JUnit 5", "Mockito", "@SpringBootTest и @WebMvcTest", "Testcontainers с PostgreSQL", "Как тестировать многопоточный код"],
      lc: [[79,"word-search","M"],[131,"palindrome-partitioning","M"],[17,"letter-combinations-of-a-phone-number","M"],[200,"number-of-islands","M"],[133,"clone-graph","M"]],
      project: "pay-lite: тест «100 параллельных переводов — баланс сходится»" },

    { n: 16, title: "Spring Security", goal: "Закрыть API логином через JWT и ролями",
      theory: ["Security filter chain", "JWT-аутентификация", "Роли и @PreAuthorize", "BCrypt и хранение паролей", "OWASP Top 10 для бэкенда"],
      lc: [[695,"max-area-of-island","M"],[417,"pacific-atlantic-water-flow","M"],[130,"surrounded-regions","M"],[994,"rotting-oranges","M"]],
      project: "pay-lite: регистрация и логин через JWT" },
    { n: 17, title: "Docker и CI", goal: "Проект 1 готов: запускается одной командой и задеплоен",
      theory: ["Docker: образы, слои, Dockerfile", "docker-compose", "Git: rebase, PR, понятные коммиты", "CI: GitHub Actions / GitLab CI", "Деплой на Railway"],
      lc: [[207,"course-schedule","M"],[210,"course-schedule-ii","M"],[684,"redundant-connection","M"],[743,"network-delay-time","M"]],
      project: "pay-lite: docker-compose, CI с тестами, деплой, README с архитектурой" },

    { n: 18, title: "Kafka", goal: "Связать два сервиса через события в Kafka",
      theory: ["Монолит vs микросервисы", "Kafka: топики, партиции, consumer groups", "Spring Kafka: producer и consumer", "Гарантии доставки и идемпотентность", "Transactional outbox"],
      lc: [[70,"climbing-stairs","E"],[746,"min-cost-climbing-stairs","E"],[198,"house-robber","M"],[213,"house-robber-ii","M"],[5,"longest-palindromic-substring","M"]],
      project: "Проект 2 «shop-lite»: сервисы каталога и заказов, docker-compose с Kafka" },
    { n: 19, title: "Redis и кэш", goal: "Ускорить каталог кэшем и не отдавать устаревшие данные",
      theory: ["Redis: структуры данных", "@Cacheable и кэширование в Spring", "TTL и инвалидация кэша", "Rate limiting", "Распределённая блокировка в общих чертах"],
      lc: [[647,"palindromic-substrings","M"],[91,"decode-ways","M"],[322,"coin-change","M"],[152,"maximum-product-subarray","M"],[139,"word-break","M"]],
      project: "shop-lite: заказ → событие → notification-service, Redis-кэш каталога" },
    { n: 20, title: "Надёжность сервисов", goal: "Сервисы переживают падение соседа",
      theory: ["Логирование и Actuator", "Метрики: Micrometer, Prometheus", "Retry и circuit breaker (Resilience4j)", "API Gateway", "Поиск: ElasticSearch в общих чертах"],
      lc: [[300,"longest-increasing-subsequence","M"],[416,"partition-equal-subset-sum","M"],[62,"unique-paths","M"],[1143,"longest-common-subsequence","M"],[309,"best-time-to-buy-and-sell-stock-with-cooldown","M"]],
      project: "shop-lite: сервис склада, резервирование товара, retry при сбоях" },
    { n: 21, title: "System design", goal: "Нарисовать архитектуру платёжной системы за 30 минут",
      theory: ["Масштабирование и балансировка", "Репликация и шардирование", "CAP-теорема", "Стратегии кэширования", "Разбор: дизайн платёжной системы"],
      lc: [[518,"coin-change-ii","M"],[494,"target-sum","M"],[72,"edit-distance","M"],[53,"maximum-subarray","M"],[55,"jump-game","M"]],
      project: "shop-lite: тесты, README, диаграмма архитектуры, деплой" },

    { n: 22, title: "Резюме и профиль", goal: "Резюме и GitHub готовы к отправке",
      theory: ["Резюме на 1 страницу", "Профиль hh.kz и LinkedIn", "Повтор: Java Core вопросы", "Повтор: Spring вопросы", "Повтор: SQL вопросы"],
      lc: [[45,"jump-game-ii","M"],[134,"gas-station","M"],[846,"hand-of-straights","M"],[763,"partition-labels","M"],[57,"insert-interval","M"]],
      project: "Закрепить 2 проекта в профиле GitHub, обновить README профиля" },
    { n: 23, title: "Мок-собеседования", goal: "Пройти 3 мок-собеса и отправить отклики",
      theory: ["Мок: алгоритмы вслух за 45 минут", "Мок: Java Core", "Мок: system design", "Behavioral: истории по STAR", "Отклик на стажировку Kaspi"],
      lc: [[56,"merge-intervals","M"],[435,"non-overlapping-intervals","M"],[124,"binary-tree-maximum-path-sum","H"],[297,"serialize-and-deserialize-binary-tree","H"],[84,"largest-rectangle-in-histogram","H"]],
      project: "Отклики: Kaspi + 5 запасных компаний" },
    { n: 24, title: "Финишная прямая", goal: "Закрыть слабые места и быть готовым к любому этапу",
      theory: ["Повтор слабых тем", "Перерешать задачи с ошибками", "Повтор многопоточности", "Повтор system design", "Подготовка вопросов к работодателю"],
      lc: [[127,"word-ladder","H"],[1584,"min-cost-to-connect-all-points","M"],[1321,"restaurant-growth","M"],[185,"department-top-three-salaries","H"],[626,"exchange-seats","M"]],
      project: "Итог: всё отправлено, жду ответов" }
  ]
};

// Разворачиваем недели в дни: Пн–Пт теория + задачи, Сб проект, Вс повтор.
window.buildDays = function (week) {
  const days = [];
  const lc = week.lc.slice();
  const perDay = [[], [], [], [], [], [], []];
  // раскладываем задачи по Пн–Сб по кругу
  lc.forEach((p, i) => perDay[i % 6].push(p));
  for (let d = 0; d < 7; d++) {
    const tasks = [];
    let goal;
    if (d < 5) {
      goal = week.theory[d];
      tasks.push({ id: `w${week.n}-d${d}-t`, kind: "theory", text: week.theory[d], mins: week.light ? 30 : 60 });
      if (!week.light && week.theory[d] !== "Отдых")
        tasks.push({ id: `w${week.n}-d${d}-k`, kind: "keys", text: "Записать ключевые слова по теме в заметку дня", mins: 10 });
    } else if (d === 5) {
      goal = "Проект: " + week.project;
      tasks.push({ id: `w${week.n}-d5-p`, kind: "project", text: week.project, mins: week.light ? 0 : 180 });
    } else {
      goal = "Повтор недели";
      tasks.push({ id: `w${week.n}-d6-r`, kind: "review", text: "Перерешать 2 задачи недели без подсказок", mins: 60 });
      tasks.push({ id: `w${week.n}-d6-q`, kind: "review", text: "Ответить вслух на 5 вопросов по темам недели", mins: 20 });
    }
    perDay[d].forEach(([num, slug, diff]) =>
      tasks.push({ id: `lc-${num}`, kind: "lc", num, slug, diff, text: `${num}. ${slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}`, mins: diff === "E" ? 20 : diff === "M" ? 40 : 60 })
    );
    days.push({ d, goal, tasks: tasks.filter(t => t.mins !== 0) });
  }
  return days;
};

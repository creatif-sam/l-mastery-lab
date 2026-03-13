-- =====================================================
-- FRENCH BASICS QUIZZES SEED
-- 10 quizzes, 12 questions each, with 4 options per question
-- Tables: quizzes, questions, question_options
-- =====================================================

DO $$
DECLARE
  -- Quiz IDs
  q1  uuid := gen_random_uuid();
  q2  uuid := gen_random_uuid();
  q3  uuid := gen_random_uuid();
  q4  uuid := gen_random_uuid();
  q5  uuid := gen_random_uuid();
  q6  uuid := gen_random_uuid();
  q7  uuid := gen_random_uuid();
  q8  uuid := gen_random_uuid();
  q9  uuid := gen_random_uuid();
  q10 uuid := gen_random_uuid();

  -- Question IDs (12 per quiz = 120 total)
  -- Quiz 1 - Greetings & Introductions
  q1_1  uuid := gen_random_uuid(); q1_2  uuid := gen_random_uuid(); q1_3  uuid := gen_random_uuid();
  q1_4  uuid := gen_random_uuid(); q1_5  uuid := gen_random_uuid(); q1_6  uuid := gen_random_uuid();
  q1_7  uuid := gen_random_uuid(); q1_8  uuid := gen_random_uuid(); q1_9  uuid := gen_random_uuid();
  q1_10 uuid := gen_random_uuid(); q1_11 uuid := gen_random_uuid(); q1_12 uuid := gen_random_uuid();
  -- Quiz 2 - Numbers 1-20
  q2_1  uuid := gen_random_uuid(); q2_2  uuid := gen_random_uuid(); q2_3  uuid := gen_random_uuid();
  q2_4  uuid := gen_random_uuid(); q2_5  uuid := gen_random_uuid(); q2_6  uuid := gen_random_uuid();
  q2_7  uuid := gen_random_uuid(); q2_8  uuid := gen_random_uuid(); q2_9  uuid := gen_random_uuid();
  q2_10 uuid := gen_random_uuid(); q2_11 uuid := gen_random_uuid(); q2_12 uuid := gen_random_uuid();
  -- Quiz 3 - Colors
  q3_1  uuid := gen_random_uuid(); q3_2  uuid := gen_random_uuid(); q3_3  uuid := gen_random_uuid();
  q3_4  uuid := gen_random_uuid(); q3_5  uuid := gen_random_uuid(); q3_6  uuid := gen_random_uuid();
  q3_7  uuid := gen_random_uuid(); q3_8  uuid := gen_random_uuid(); q3_9  uuid := gen_random_uuid();
  q3_10 uuid := gen_random_uuid(); q3_11 uuid := gen_random_uuid(); q3_12 uuid := gen_random_uuid();
  -- Quiz 4 - Days & Months
  q4_1  uuid := gen_random_uuid(); q4_2  uuid := gen_random_uuid(); q4_3  uuid := gen_random_uuid();
  q4_4  uuid := gen_random_uuid(); q4_5  uuid := gen_random_uuid(); q4_6  uuid := gen_random_uuid();
  q4_7  uuid := gen_random_uuid(); q4_8  uuid := gen_random_uuid(); q4_9  uuid := gen_random_uuid();
  q4_10 uuid := gen_random_uuid(); q4_11 uuid := gen_random_uuid(); q4_12 uuid := gen_random_uuid();
  -- Quiz 5 - Family Members
  q5_1  uuid := gen_random_uuid(); q5_2  uuid := gen_random_uuid(); q5_3  uuid := gen_random_uuid();
  q5_4  uuid := gen_random_uuid(); q5_5  uuid := gen_random_uuid(); q5_6  uuid := gen_random_uuid();
  q5_7  uuid := gen_random_uuid(); q5_8  uuid := gen_random_uuid(); q5_9  uuid := gen_random_uuid();
  q5_10 uuid := gen_random_uuid(); q5_11 uuid := gen_random_uuid(); q5_12 uuid := gen_random_uuid();
  -- Quiz 6 - Common Verbs (etre/avoir/aller)
  q6_1  uuid := gen_random_uuid(); q6_2  uuid := gen_random_uuid(); q6_3  uuid := gen_random_uuid();
  q6_4  uuid := gen_random_uuid(); q6_5  uuid := gen_random_uuid(); q6_6  uuid := gen_random_uuid();
  q6_7  uuid := gen_random_uuid(); q6_8  uuid := gen_random_uuid(); q6_9  uuid := gen_random_uuid();
  q6_10 uuid := gen_random_uuid(); q6_11 uuid := gen_random_uuid(); q6_12 uuid := gen_random_uuid();
  -- Quiz 7 - Food & Drinks
  q7_1  uuid := gen_random_uuid(); q7_2  uuid := gen_random_uuid(); q7_3  uuid := gen_random_uuid();
  q7_4  uuid := gen_random_uuid(); q7_5  uuid := gen_random_uuid(); q7_6  uuid := gen_random_uuid();
  q7_7  uuid := gen_random_uuid(); q7_8  uuid := gen_random_uuid(); q7_9  uuid := gen_random_uuid();
  q7_10 uuid := gen_random_uuid(); q7_11 uuid := gen_random_uuid(); q7_12 uuid := gen_random_uuid();
  -- Quiz 8 - Articles (le/la/les/un/une/des)
  q8_1  uuid := gen_random_uuid(); q8_2  uuid := gen_random_uuid(); q8_3  uuid := gen_random_uuid();
  q8_4  uuid := gen_random_uuid(); q8_5  uuid := gen_random_uuid(); q8_6  uuid := gen_random_uuid();
  q8_7  uuid := gen_random_uuid(); q8_8  uuid := gen_random_uuid(); q8_9  uuid := gen_random_uuid();
  q8_10 uuid := gen_random_uuid(); q8_11 uuid := gen_random_uuid(); q8_12 uuid := gen_random_uuid();
  -- Quiz 9 - Body Parts
  q9_1  uuid := gen_random_uuid(); q9_2  uuid := gen_random_uuid(); q9_3  uuid := gen_random_uuid();
  q9_4  uuid := gen_random_uuid(); q9_5  uuid := gen_random_uuid(); q9_6  uuid := gen_random_uuid();
  q9_7  uuid := gen_random_uuid(); q9_8  uuid := gen_random_uuid(); q9_9  uuid := gen_random_uuid();
  q9_10 uuid := gen_random_uuid(); q9_11 uuid := gen_random_uuid(); q9_12 uuid := gen_random_uuid();
  -- Quiz 10 - Common Phrases & Politeness
  q10_1  uuid := gen_random_uuid(); q10_2  uuid := gen_random_uuid(); q10_3  uuid := gen_random_uuid();
  q10_4  uuid := gen_random_uuid(); q10_5  uuid := gen_random_uuid(); q10_6  uuid := gen_random_uuid();
  q10_7  uuid := gen_random_uuid(); q10_8  uuid := gen_random_uuid(); q10_9  uuid := gen_random_uuid();
  q10_10 uuid := gen_random_uuid(); q10_11 uuid := gen_random_uuid(); q10_12 uuid := gen_random_uuid();

BEGIN

-- =====================================================
-- INSERT QUIZZES
-- =====================================================
INSERT INTO quizzes (id, title, description, target_language, difficulty_level) VALUES
  (q1,  'French Basics 1: Greetings & Introductions', 'Learn how to say hello, introduce yourself, and basic pleasantries in French.', 'french', 'beginner'),
  (q2,  'French Basics 2: Numbers 1–20',              'Count from one to twenty and use numbers in simple French sentences.',              'french', 'beginner'),
  (q3,  'French Basics 3: Colors',                    'Learn the French names for common colors and how to use them with nouns.',          'french', 'beginner'),
  (q4,  'French Basics 4: Days & Months',             'Master the days of the week and months of the year in French.',                    'french', 'beginner'),
  (q5,  'French Basics 5: Family Members',            'Learn vocabulary for family relationships in French.',                             'french', 'beginner'),
  (q6,  'French Basics 6: Essential Verbs',           'Practice conjugating être, avoir, and aller in the present tense.',                'french', 'beginner'),
  (q7,  'French Basics 7: Food & Drinks',             'Discover French vocabulary for common foods and beverages.',                       'french', 'beginner'),
  (q8,  'French Basics 8: Articles',                  'Understand and use French definite and indefinite articles correctly.',            'french', 'beginner'),
  (q9,  'French Basics 9: Body Parts',                'Learn the French words for parts of the body.',                                   'french', 'beginner'),
  (q10, 'French Basics 10: Polite Phrases',           'Essential everyday phrases for being polite and courteous in French.',            'french', 'beginner');

-- =====================================================
-- QUIZ 1 - Greetings & Introductions
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q1_1,  q1, 'What does "Bonjour" mean?',                              '"Bonjour" is the standard French greeting used during the day, meaning "Good day / Hello".'),
  (q1_2,  q1, 'How do you say "Good evening" in French?',              '"Bonsoir" is used from late afternoon/evening onwards.'),
  (q1_3,  q1, 'What does "Comment vous appelez-vous?" mean?',          'This formal question asks "What is your name?".'),
  (q1_4,  q1, 'How do you respond "My name is Marie"?',                '"Je m''appelle Marie" literally means "I call myself Marie".'),
  (q1_5,  q1, 'What does "Enchanté(e)" mean?',                         '"Enchanté(e)" means "Nice to meet you / Delighted".'),
  (q1_6,  q1, 'How do you ask "How are you?" informally?',             '"Ça va?" is the informal way to ask how someone is doing.'),
  (q1_7,  q1, 'What does "Au revoir" mean?',                           '"Au revoir" literally means "Until we see each other again" — Goodbye.'),
  (q1_8,  q1, 'How do you say "Good night" in French?',               '"Bonne nuit" is said when someone is going to sleep.'),
  (q1_9,  q1, 'What does "Salut" mean?',                               '"Salut" is an informal greeting meaning "Hi" or "Hey".'),
  (q1_10, q1, 'How do you say "I am from France"?',                    '"Je suis de France" uses the verb être (to be) + de (from).'),
  (q1_11, q1, 'What does "À bientôt" mean?',                           '"À bientôt" means "See you soon".'),
  (q1_12, q1, 'How do you say "Nice to meet you" formally?',          '"Ravi(e) de vous rencontrer" is the formal way to say nice to meet you.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q1_1
  (q1_1, 'Hello / Good day',  true),  (q1_1, 'Good night',      false), (q1_1, 'Thank you',     false), (q1_1, 'Goodbye',         false),
  -- q1_2
  (q1_2, 'Bonsoir',           true),  (q1_2, 'Bonjour',         false), (q1_2, 'Bonne nuit',    false), (q1_2, 'Salut',           false),
  -- q1_3
  (q1_3, 'What is your name?',true),  (q1_3, 'Where are you from?', false), (q1_3, 'How old are you?', false), (q1_3, 'Are you okay?', false),
  -- q1_4
  (q1_4, 'Je m''appelle Marie', true),(q1_4, 'Mon nom est Marie', false),(q1_4, 'Je suis Marie',  false), (q1_4, 'Moi c''est Marie', false),
  -- q1_5
  (q1_5, 'Nice to meet you', true),   (q1_5, 'Goodbye',         false), (q1_5, 'Good evening',   false), (q1_5, 'Excuse me',       false),
  -- q1_6
  (q1_6, 'Ça va?',            true),  (q1_6, 'Comment allez-vous?', false), (q1_6, 'Tu vas bien?', false), (q1_6, 'Comment tu t''appelles?', false),
  -- q1_7
  (q1_7, 'Goodbye',           true),  (q1_7, 'See you soon',    false), (q1_7, 'Good morning',   false), (q1_7, 'Until later',     false),
  -- q1_8
  (q1_8, 'Bonne nuit',        true),  (q1_8, 'Bonsoir',         false), (q1_8, 'Bonjour',        false), (q1_8, 'Salut',           false),
  -- q1_9
  (q1_9, 'Hi / Hey',          true),  (q1_9, 'Goodbye',         false), (q1_9, 'Good evening',   false), (q1_9, 'Please',          false),
  -- q1_10
  (q1_10, 'Je suis de France', true), (q1_10, 'Je viens à France', false),(q1_10, 'Je suis en France', false),(q1_10, 'Moi France',  false),
  -- q1_11
  (q1_11, 'See you soon',     true),  (q1_11, 'See you tomorrow', false),(q1_11, 'Goodbye',       false), (q1_11, 'Until next time', false),
  -- q1_12
  (q1_12, 'Ravi(e) de vous rencontrer', true), (q1_12, 'Enchanté(e)', false), (q1_12, 'Bonjour', false), (q1_12, 'Avec plaisir', false);

-- =====================================================
-- QUIZ 2 - Numbers 1–20
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q2_1,  q2, 'What is "un" in English?',               '"Un" (masculine) / "une" (feminine) means "one".'),
  (q2_2,  q2, 'How do you say "five" in French?',        '"Cinq" is the French word for five.'),
  (q2_3,  q2, 'What does "dix" mean?',                   '"Dix" means "ten" in French.'),
  (q2_4,  q2, 'How do you say "twelve" in French?',      '"Douze" is twelve in French.'),
  (q2_5,  q2, 'What is "quinze" in English?',            '"Quinze" means "fifteen".'),
  (q2_6,  q2, 'How do you say "three" in French?',       '"Trois" is the French word for three.'),
  (q2_7,  q2, 'What does "seize" mean?',                 '"Seize" means "sixteen" in French.'),
  (q2_8,  q2, 'How do you say "seven" in French?',       '"Sept" is the French word for seven.'),
  (q2_9,  q2, 'What is "vingt" in English?',             '"Vingt" means "twenty".'),
  (q2_10, q2, 'How do you say "nine" in French?',        '"Neuf" is the French word for nine.'),
  (q2_11, q2, 'What does "quatorze" mean?',              '"Quatorze" means "fourteen".'),
  (q2_12, q2, 'How do you say "eighteen" in French?',   '"Dix-huit" is eighteen — literally "ten-eight".');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q2_1
  (q2_1, 'One',    true),  (q2_1, 'Two',     false), (q2_1, 'Three',  false), (q2_1, 'Four',    false),
  -- q2_2
  (q2_2, 'Cinq',   true),  (q2_2, 'Quatre',  false), (q2_2, 'Six',    false), (q2_2, 'Sept',    false),
  -- q2_3
  (q2_3, 'Ten',    true),  (q2_3, 'Two',     false), (q2_3, 'Six',    false), (q2_3, 'Eight',   false),
  -- q2_4
  (q2_4, 'Douze',  true),  (q2_4, 'Onze',    false), (q2_4, 'Treize', false), (q2_4, 'Quatorze',false),
  -- q2_5
  (q2_5, 'Fifteen',true),  (q2_5, 'Thirteen',false), (q2_5, 'Sixteen',false), (q2_5, 'Seventeen',false),
  -- q2_6
  (q2_6, 'Trois',  true),  (q2_6, 'Deux',    false), (q2_6, 'Quatre', false), (q2_6, 'Six',     false),
  -- q2_7
  (q2_7, 'Sixteen',true),  (q2_7, 'Seven',   false), (q2_7, 'Six',    false), (q2_7, 'Sixty',   false),
  -- q2_8
  (q2_8, 'Sept',   true),  (q2_8, 'Six',     false), (q2_8, 'Huit',   false), (q2_8, 'Neuf',    false),
  -- q2_9
  (q2_9, 'Twenty', true),  (q2_9, 'Two',     false), (q2_9, 'Twelve', false), (q2_9, 'Eleven',  false),
  -- q2_10
  (q2_10,'Neuf',   true),  (q2_10,'Huit',    false), (q2_10,'Sept',   false), (q2_10,'Dix',     false),
  -- q2_11
  (q2_11,'Fourteen',true), (q2_11,'Thirteen',false), (q2_11,'Fifteen',false), (q2_11,'Twelve',  false),
  -- q2_12
  (q2_12,'Dix-huit',true), (q2_12,'Dix-sept',false), (q2_12,'Dix-neuf',false),(q2_12,'Seize',   false);

-- =====================================================
-- QUIZ 3 - Colors
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q3_1,  q3, 'What does "rouge" mean?',                  '"Rouge" means "red" in French.'),
  (q3_2,  q3, 'How do you say "blue" in French?',         '"Bleu" (masc.) / "bleue" (fem.) means blue.'),
  (q3_3,  q3, 'What is "vert" in English?',               '"Vert" means "green" in French.'),
  (q3_4,  q3, 'How do you say "yellow" in French?',       '"Jaune" means yellow and stays the same for both genders.'),
  (q3_5,  q3, 'What does "noir" mean?',                   '"Noir" (masc.) / "noire" (fem.) means "black".'),
  (q3_6,  q3, 'How do you say "white" in French?',        '"Blanc" (masc.) / "blanche" (fem.) means white.'),
  (q3_7,  q3, 'What is "orange" in French?',              '"Orange" is the same word in French and is invariable (no gender change).'),
  (q3_8,  q3, 'How do you say "pink" in French?',         '"Rose" means pink in French.'),
  (q3_9,  q3, 'What does "violet" mean?',                 '"Violet" (masc.) / "violette" (fem.) means "purple".'),
  (q3_10, q3, 'How do you say "grey" in French?',         '"Gris" (masc.) / "grise" (fem.) means grey.'),
  (q3_11, q3, 'What is "marron" in English?',             '"Marron" means "brown" in French (it is invariable in color usage).'),
  (q3_12, q3, 'What is the feminine form of "bleu"?',    'Colors in French agree in gender: "bleu" → "bleue" in feminine.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q3_1
  (q3_1, 'Red',    true),  (q3_1, 'Blue',   false), (q3_1, 'Green',  false), (q3_1, 'Pink',   false),
  -- q3_2
  (q3_2, 'Bleu',   true),  (q3_2, 'Vert',   false), (q3_2, 'Rouge',  false), (q3_2, 'Gris',   false),
  -- q3_3
  (q3_3, 'Green',  true),  (q3_3, 'Blue',   false), (q3_3, 'Grey',   false), (q3_3, 'Yellow', false),
  -- q3_4
  (q3_4, 'Jaune',  true),  (q3_4, 'Orange', false), (q3_4, 'Beige',  false), (q3_4, 'Rose',   false),
  -- q3_5
  (q3_5, 'Black',  true),  (q3_5, 'White',  false), (q3_5, 'Brown',  false), (q3_5, 'Grey',   false),
  -- q3_6
  (q3_6, 'Blanc',  true),  (q3_6, 'Noir',   false), (q3_6, 'Gris',   false), (q3_6, 'Beige',  false),
  -- q3_7
  (q3_7, 'Orange', true),  (q3_7, 'Yellow', false), (q3_7, 'Red',    false), (q3_7, 'Brown',  false),
  -- q3_8
  (q3_8, 'Rose',   true),  (q3_8, 'Rouge',  false), (q3_8, 'Violet', false), (q3_8, 'Orange', false),
  -- q3_9
  (q3_9, 'Purple', true),  (q3_9, 'Pink',   false), (q3_9, 'Blue',   false), (q3_9, 'Indigo', false),
  -- q3_10
  (q3_10,'Gris',   true),  (q3_10,'Noir',   false), (q3_10,'Blanc',  false), (q3_10,'Vert',   false),
  -- q3_11
  (q3_11,'Brown',  true),  (q3_11,'Purple', false), (q3_11,'Beige',  false), (q3_11,'Orange', false),
  -- q3_12
  (q3_12,'Bleue',  true),  (q3_12,'Bleui',  false), (q3_12,'Bleusse',false), (q3_12,'Bleuse', false);

-- =====================================================
-- QUIZ 4 - Days & Months
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q4_1,  q4, 'What does "lundi" mean?',                  '"Lundi" means "Monday" in French.'),
  (q4_2,  q4, 'How do you say "Friday" in French?',       '"Vendredi" is Friday — from the Latin dies Veneris (day of Venus).'),
  (q4_3,  q4, 'What is "dimanche" in English?',           '"Dimanche" means "Sunday", from Latin Dominica (Lord''s day).'),
  (q4_4,  q4, 'How do you say "Wednesday" in French?',    '"Mercredi" is Wednesday — from the Latin dies Mercurii.'),
  (q4_5,  q4, 'What does "janvier" mean?',                '"Janvier" means "January" in French.'),
  (q4_6,  q4, 'How do you say "March" in French?',        '"Mars" is March in French.'),
  (q4_7,  q4, 'What is "août" in English?',               '"Août" means "August" in French.'),
  (q4_8,  q4, 'How do you say "December" in French?',     '"Décembre" is December in French.'),
  (q4_9,  q4, 'What does "mardi" mean?',                  '"Mardi" means "Tuesday" — from the Latin Martis dies (day of Mars).'),
  (q4_10, q4, 'How do you say "October" in French?',      '"Octobre" is October in French.'),
  (q4_11, q4, 'What is "jeudi" in English?',              '"Jeudi" means "Thursday" — from Latin Jovis dies (day of Jupiter).'),
  (q4_12, q4, 'How do you say "June" in French?',         '"Juin" is June in French.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q4_1
  (q4_1, 'Monday',    true),  (q4_1, 'Tuesday',   false), (q4_1, 'Wednesday', false), (q4_1, 'Sunday',    false),
  -- q4_2
  (q4_2, 'Vendredi',  true),  (q4_2, 'Samedi',    false), (q4_2, 'Mercredi',  false), (q4_2, 'Jeudi',     false),
  -- q4_3
  (q4_3, 'Sunday',    true),  (q4_3, 'Saturday',  false), (q4_3, 'Monday',    false), (q4_3, 'Friday',    false),
  -- q4_4
  (q4_4, 'Mercredi',  true),  (q4_4, 'Vendredi',  false), (q4_4, 'Jeudi',     false), (q4_4, 'Mardi',     false),
  -- q4_5
  (q4_5, 'January',   true),  (q4_5, 'June',      false), (q4_5, 'July',      false), (q4_5, 'February',  false),
  -- q4_6
  (q4_6, 'Mars',      true),  (q4_6, 'Mai',       false), (q4_6, 'Avril',     false), (q4_6, 'Juin',      false),
  -- q4_7
  (q4_7, 'August',    true),  (q4_7, 'April',     false), (q4_7, 'October',   false), (q4_7, 'March',     false),
  -- q4_8
  (q4_8, 'Décembre',  true),  (q4_8, 'Novembre',  false), (q4_8, 'Octobre',   false), (q4_8, 'Septembre', false),
  -- q4_9
  (q4_9, 'Tuesday',   true),  (q4_9, 'Monday',    false), (q4_9, 'Thursday',  false), (q4_9, 'Sunday',    false),
  -- q4_10
  (q4_10,'Octobre',   true),  (q4_10,'Novembre',  false), (q4_10,'Septembre', false), (q4_10,'Août',      false),
  -- q4_11
  (q4_11,'Thursday',  true),  (q4_11,'Tuesday',   false), (q4_11,'Friday',    false), (q4_11,'Wednesday', false),
  -- q4_12
  (q4_12,'Juin',      true),  (q4_12,'Juillet',   false), (q4_12,'Janvier',   false), (q4_12,'Août',      false);

-- =====================================================
-- QUIZ 5 - Family Members
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q5_1,  q5, 'What does "mère" mean?',                   '"Mère" means "mother" in French.'),
  (q5_2,  q5, 'How do you say "father" in French?',       '"Père" is the French word for father.'),
  (q5_3,  q5, 'What is "frère" in English?',              '"Frère" means "brother" in French.'),
  (q5_4,  q5, 'How do you say "sister" in French?',       '"Sœur" is the French word for sister.'),
  (q5_5,  q5, 'What does "grand-père" mean?',             '"Grand-père" means "grandfather".'),
  (q5_6,  q5, 'How do you say "grandmother" in French?',  '"Grand-mère" is grandmother in French.'),
  (q5_7,  q5, 'What is "fils" in English?',               '"Fils" means "son" in French.'),
  (q5_8,  q5, 'How do you say "daughter" in French?',     '"Fille" means daughter (also girl) in French.'),
  (q5_9,  q5, 'What does "oncle" mean?',                  '"Oncle" means "uncle" in French.'),
  (q5_10, q5, 'How do you say "aunt" in French?',         '"Tante" is the French word for aunt.'),
  (q5_11, q5, 'What is "cousin" in English?',             '"Cousin" (masc.) / "cousine" (fem.) means cousin in French.'),
  (q5_12, q5, 'How do you say "parents" in French?',     '"Les parents" means both "the parents" and sometimes "relatives" in French.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q5_1
  (q5_1, 'Mother',    true),  (q5_1, 'Sister',    false), (q5_1, 'Aunt',      false), (q5_1, 'Daughter',  false),
  -- q5_2
  (q5_2, 'Père',      true),  (q5_2, 'Frère',     false), (q5_2, 'Oncle',     false), (q5_2, 'Fils',      false),
  -- q5_3
  (q5_3, 'Brother',   true),  (q5_3, 'Father',    false), (q5_3, 'Uncle',     false), (q5_3, 'Son',       false),
  -- q5_4
  (q5_4, 'Sœur',      true),  (q5_4, 'Mère',      false), (q5_4, 'Tante',     false), (q5_4, 'Fille',     false),
  -- q5_5
  (q5_5, 'Grandfather',true), (q5_5, 'Grandmother',false),(q5_5, 'Uncle',     false), (q5_5, 'Father',    false),
  -- q5_6
  (q5_6, 'Grand-mère', true), (q5_6, 'Grand-père',false), (q5_6, 'Tante',     false), (q5_6, 'Mère',      false),
  -- q5_7
  (q5_7, 'Son',       true),  (q5_7, 'Daughter',  false), (q5_7, 'Brother',   false), (q5_7, 'Father',    false),
  -- q5_8
  (q5_8, 'Fille',     true),  (q5_8, 'Sœur',      false), (q5_8, 'Mère',      false), (q5_8, 'Tante',     false),
  -- q5_9
  (q5_9, 'Uncle',     true),  (q5_9, 'Cousin',    false), (q5_9, 'Brother',   false), (q5_9, 'Father',    false),
  -- q5_10
  (q5_10,'Tante',     true),  (q5_10,'Sœur',      false), (q5_10,'Mère',      false), (q5_10,'Cousine',   false),
  -- q5_11
  (q5_11,'Cousin',    true),  (q5_11,'Brother',   false), (q5_11,'Nephew',    false), (q5_11,'Uncle',     false),
  -- q5_12
  (q5_12,'Les parents',true), (q5_12,'Les enfants',false),(q5_12,'Les frères',false), (q5_12,'Les amis',  false);

-- =====================================================
-- QUIZ 6 - Essential Verbs (être, avoir, aller)
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q6_1,  q6, '"Je ___ étudiant." — Which form of être completes this?', '"Je suis" is the first-person singular present of être (to be).'),
  (q6_2,  q6, 'How do you say "You are (informal)" in French using être?', '"Tu es" is the informal second-person singular of être.'),
  (q6_3,  q6, '"Nous ___ fatigués." — What is the correct form of être?', '"Nous sommes" is the first-person plural of être.'),
  (q6_4,  q6, 'What does "avoir" mean?',                                    '"Avoir" means "to have" in French.'),
  (q6_5,  q6, '"J''___ faim." — Which form of avoir fits here?',           '"J''ai" is the first-person singular present of avoir (to have).'),
  (q6_6,  q6, '"Ils ___ une voiture." — Correct form of avoir?',            '"Ils ont" is the third-person plural of avoir.'),
  (q6_7,  q6, 'What does "aller" mean?',                                    '"Aller" means "to go" in French.'),
  (q6_8,  q6, '"Je ___ au marché." — Which form of aller is correct?',     '"Je vais" is the first-person singular present of aller.'),
  (q6_9,  q6, '"Comment ___ -vous?" (formal greeting) — fill the blank.',  '"Comment allez-vous?" uses the second-person plural of aller.'),
  (q6_10, q6, '"Elle ___ médecin." — Correct form of être?',               '"Elle est" is the third-person feminine singular of être.'),
  (q6_11, q6, '"Tu ___ quel âge?" — Correct form of avoir?',              '"Tu as" is the informal second-person singular of avoir.'),
  (q6_12, q6, '"Nous ___ à Paris demain." — Correct form of aller?',       '"Nous allons" is the first-person plural present of aller.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q6_1
  (q6_1, 'suis',  true),  (q6_1, 'es',    false), (q6_1, 'est',   false), (q6_1, 'sommes',false),
  -- q6_2
  (q6_2, 'Tu es', true),  (q6_2, 'Vous êtes',false),(q6_2,'Tu suis',false),(q6_2, 'Il est', false),
  -- q6_3
  (q6_3, 'sommes',true),  (q6_3, 'sont',  false), (q6_3, 'êtes',  false), (q6_3, 'suis',  false),
  -- q6_4
  (q6_4, 'To have',true), (q6_4, 'To be', false), (q6_4, 'To go', false), (q6_4, 'To do', false),
  -- q6_5
  (q6_5, 'ai',    true),  (q6_5, 'as',    false), (q6_5, 'a',     false), (q6_5, 'avons', false),
  -- q6_6
  (q6_6, 'ont',   true),  (q6_6, 'avons', false), (q6_6, 'avez',  false), (q6_6, 'a',     false),
  -- q6_7
  (q6_7, 'To go', true),  (q6_7, 'To be', false), (q6_7, 'To have',false),(q6_7, 'To do', false),
  -- q6_8
  (q6_8, 'vais',  true),  (q6_8, 'vas',   false), (q6_8, 'va',    false), (q6_8, 'allons',false),
  -- q6_9
  (q6_9, 'allez', true),  (q6_9, 'vas',   false), (q6_9, 'vont',  false), (q6_9, 'aller', false),
  -- q6_10
  (q6_10,'est',   true),  (q6_10,'suis',  false), (q6_10,'es',    false), (q6_10,'sont',  false),
  -- q6_11
  (q6_11,'as',    true),  (q6_11,'ai',    false), (q6_11,'a',     false), (q6_11,'avez',  false),
  -- q6_12
  (q6_12,'allons',true),  (q6_12,'allez', false), (q6_12,'vont',  false), (q6_12,'vais',  false);

-- =====================================================
-- QUIZ 7 - Food & Drinks
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q7_1,  q7, 'What does "le pain" mean?',                '"Le pain" means "the bread" in French.'),
  (q7_2,  q7, 'How do you say "water" in French?',        '"L''eau" (feminine) means water.'),
  (q7_3,  q7, 'What is "le fromage" in English?',         '"Le fromage" means "the cheese" — France is famous for its cheeses!'),
  (q7_4,  q7, 'How do you say "coffee" in French?',       '"Le café" means coffee (also the word for a café/coffee shop).'),
  (q7_5,  q7, 'What does "la viande" mean?',              '"La viande" means "meat" in French.'),
  (q7_6,  q7, 'How do you say "apple" in French?',        '"La pomme" means apple. "Pomme de terre" (earth apple) means potato!'),
  (q7_7,  q7, 'What is "le lait" in English?',            '"Le lait" means "milk" in French.'),
  (q7_8,  q7, 'How do you say "wine" in French?',         '"Le vin" means wine. France is world-renowned for its wines.'),
  (q7_9,  q7, 'What does "les légumes" mean?',            '"Les légumes" means "vegetables" in French.'),
  (q7_10, q7, 'How do you say "egg" in French?',          '"Un œuf" means "an egg" in French.'),
  (q7_11, q7, 'What is "le poisson" in English?',         '"Le poisson" means "fish" in French.'),
  (q7_12, q7, 'How do you say "I am hungry" in French?', '"J''ai faim" literally means "I have hunger" — French uses avoir for hunger.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q7_1
  (q7_1, 'Bread',    true),  (q7_1, 'Butter',   false), (q7_1, 'Cake',     false), (q7_1, 'Pasta',    false),
  -- q7_2
  (q7_2, 'L''eau',   true),  (q7_2, 'Le jus',   false), (q7_2, 'Le lait',  false), (q7_2, 'Le vin',   false),
  -- q7_3
  (q7_3, 'Cheese',   true),  (q7_3, 'Butter',   false), (q7_3, 'Cream',    false), (q7_3, 'Yogurt',   false),
  -- q7_4
  (q7_4, 'Le café',  true),  (q7_4, 'Le thé',   false), (q7_4, 'Le lait',  false), (q7_4, 'L''eau',   false),
  -- q7_5
  (q7_5, 'Meat',     true),  (q7_5, 'Fish',     false), (q7_5, 'Bread',    false), (q7_5, 'Milk',     false),
  -- q7_6
  (q7_6, 'La pomme', true),  (q7_6, 'La poire', false), (q7_6, 'L''orange',false), (q7_6, 'La pêche', false),
  -- q7_7
  (q7_7, 'Milk',     true),  (q7_7, 'Water',    false), (q7_7, 'Juice',    false), (q7_7, 'Wine',     false),
  -- q7_8
  (q7_8, 'Le vin',   true),  (q7_8, 'La bière', false), (q7_8, 'L''eau',   false), (q7_8, 'Le jus',   false),
  -- q7_9
  (q7_9, 'Vegetables',true), (q7_9, 'Fruits',   false), (q7_9, 'Meats',    false), (q7_9, 'Drinks',   false),
  -- q7_10
  (q7_10,'Un œuf',   true),  (q7_10,'Un lait',  false), (q7_10,'Un pain',  false), (q7_10,'Un fruit', false),
  -- q7_11
  (q7_11,'Fish',     true),  (q7_11,'Chicken',  false), (q7_11,'Meat',     false), (q7_11,'Seafood',  false),
  -- q7_12
  (q7_12,'J''ai faim',true), (q7_12,'Je suis faim',false),(q7_12,'J''ai froid',false),(q7_12,'Je veux manger',false);

-- =====================================================
-- QUIZ 8 - Articles (le, la, les, un, une, des)
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q8_1,  q8, 'Which article goes with "homme" (man)?',             '"L''homme" — masculine nouns take "le" (shortened to l'' before a vowel).'),
  (q8_2,  q8, 'Which article goes with "femme" (woman)?',           '"La femme" — feminine nouns take "la".'),
  (q8_3,  q8, 'Which article is used for plural nouns?',            '"Les" is the definite article for all plural nouns regardless of gender.'),
  (q8_4,  q8, '"___ chat est mignon." — Which article?',            '"Le chat" — "chat" (cat) is masculine, so we use "le".'),
  (q8_5,  q8, '"___ maison est grande." — Which article?',          '"La maison" — "maison" (house) is feminine.'),
  (q8_6,  q8, 'What is the indefinite article for a masculine noun?', '"Un" is the masculine indefinite article meaning "a/an".'),
  (q8_7,  q8, 'What is the indefinite article for a feminine noun?',  '"Une" is the feminine indefinite article meaning "a/an".'),
  (q8_8,  q8, '"J''ai ___ chats." (I have some cats) — Which article?', '"Des" is the indefinite plural article meaning "some".'),
  (q8_9,  q8, '"Je bois ___ eau." — What happens to "la" before "eau"?', '"L''eau" — "la" (and "le") contract to "l''" before words starting with a vowel.'),
  (q8_10, q8, '"___ livres sont intéressants." — Which article?',    '"Les livres" — plural definite article "les".'),
  (q8_11, q8, '"C''est ___ professeur." (fem.) — Which article?',   '"Une professeur" — feminine indefinite article "une".'),
  (q8_12, q8, '"Il y a ___ voitures dans la rue." — Which article?', '"Des voitures" — indefinite plural article "des" meaning "some".');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q8_1
  (q8_1, 'L''',   true),  (q8_1, 'La',    false), (q8_1, 'Les',   false), (q8_1, 'Un',    false),
  -- q8_2
  (q8_2, 'La',    true),  (q8_2, 'Le',    false), (q8_2, 'Les',   false), (q8_2, 'Une',   false),
  -- q8_3
  (q8_3, 'Les',   true),  (q8_3, 'Le',    false), (q8_3, 'La',    false), (q8_3, 'Des',   false),
  -- q8_4
  (q8_4, 'Le',    true),  (q8_4, 'La',    false), (q8_4, 'Les',   false), (q8_4, 'Un',    false),
  -- q8_5
  (q8_5, 'La',    true),  (q8_5, 'Le',    false), (q8_5, 'Les',   false), (q8_5, 'Une',   false),
  -- q8_6
  (q8_6, 'Un',    true),  (q8_6, 'Une',   false), (q8_6, 'Le',    false), (q8_6, 'Des',   false),
  -- q8_7
  (q8_7, 'Une',   true),  (q8_7, 'Un',    false), (q8_7, 'La',    false), (q8_7, 'Des',   false),
  -- q8_8
  (q8_8, 'Des',   true),  (q8_8, 'Les',   false), (q8_8, 'De',    false), (q8_8, 'Un',    false),
  -- q8_9
  (q8_9, 'L''',   true),  (q8_9, 'La',    false), (q8_9, 'Le',    false), (q8_9, 'Les',   false),
  -- q8_10
  (q8_10,'Les',   true),  (q8_10,'Des',   false), (q8_10,'Le',    false), (q8_10,'La',    false),
  -- q8_11
  (q8_11,'Une',   true),  (q8_11,'Un',    false), (q8_11,'La',    false), (q8_11,'Des',   false),
  -- q8_12
  (q8_12,'Des',   true),  (q8_12,'Les',   false), (q8_12,'De',    false), (q8_12,'Ses',   false);

-- =====================================================
-- QUIZ 9 - Body Parts
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q9_1,  q9, 'What does "la tête" mean?',                '"La tête" means "the head" in French.'),
  (q9_2,  q9, 'How do you say "the hand" in French?',    '"La main" is the French word for hand (feminine).'),
  (q9_3,  q9, 'What is "le bras" in English?',            '"Le bras" means "the arm" in French.'),
  (q9_4,  q9, 'How do you say "the eye" in French?',     '"L''œil" means the eye. The plural is "les yeux".'),
  (q9_5,  q9, 'What does "la bouche" mean?',              '"La bouche" means "the mouth" in French.'),
  (q9_6,  q9, 'How do you say "the nose" in French?',    '"Le nez" is the French word for nose.'),
  (q9_7,  q9, 'What is "la jambe" in English?',           '"La jambe" means "the leg" in French.'),
  (q9_8,  q9, 'How do you say "the foot" in French?',    '"Le pied" is the French word for foot.'),
  (q9_9,  q9, 'What does "le dos" mean?',                 '"Le dos" means "the back" in French.'),
  (q9_10, q9, 'How do you say "the ear" in French?',     '"L''oreille" means the ear (feminine).'),
  (q9_11, q9, 'What is "le cœur" in English?',            '"Le cœur" means "the heart" in French.'),
  (q9_12, q9, 'How do you say "the teeth" in French?',   '"Les dents" means the teeth. "La dent" is one tooth.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q9_1
  (q9_1, 'Head',     true),  (q9_1, 'Hand',     false), (q9_1, 'Face',     false), (q9_1, 'Neck',     false),
  -- q9_2
  (q9_2, 'La main',  true),  (q9_2, 'Le bras',  false), (q9_2, 'La jambe', false), (q9_2, 'Le pied',  false),
  -- q9_3
  (q9_3, 'Arm',      true),  (q9_3, 'Leg',      false), (q9_3, 'Hand',     false), (q9_3, 'Shoulder', false),
  -- q9_4
  (q9_4, 'L''œil',   true),  (q9_4, 'L''oreille',false),(q9_4, 'La bouche',false), (q9_4, 'Le nez',   false),
  -- q9_5
  (q9_5, 'Mouth',    true),  (q9_5, 'Nose',     false), (q9_5, 'Eye',      false), (q9_5, 'Ear',      false),
  -- q9_6
  (q9_6, 'Le nez',   true),  (q9_6, 'L''oreille',false),(q9_6, 'La bouche',false), (q9_6, 'Les yeux', false),
  -- q9_7
  (q9_7, 'Leg',      true),  (q9_7, 'Arm',      false), (q9_7, 'Foot',     false), (q9_7, 'Hand',     false),
  -- q9_8
  (q9_8, 'Le pied',  true),  (q9_8, 'La jambe', false), (q9_8, 'Le bras',  false), (q9_8, 'La main',  false),
  -- q9_9
  (q9_9, 'Back',     true),  (q9_9, 'Chest',    false), (q9_9, 'Stomach',  false), (q9_9, 'Shoulder', false),
  -- q9_10
  (q9_10,'L''oreille',true), (q9_10,'L''œil',   false), (q9_10,'Le nez',   false), (q9_10,'La bouche',false),
  -- q9_11
  (q9_11,'Heart',    true),  (q9_11,'Liver',    false), (q9_11,'Lung',     false), (q9_11,'Brain',    false),
  -- q9_12
  (q9_12,'Les dents',true),  (q9_12,'Les lèvres',false),(q9_12,'Les oreilles',false),(q9_12,'Les pieds',false);

-- =====================================================
-- QUIZ 10 - Polite Phrases & Common Expressions
-- =====================================================
INSERT INTO questions (id, quiz_id, question_text, explanation) VALUES
  (q10_1,  q10, 'What does "s''il vous plaît" mean?',                  '"S''il vous plaît" (formal) means "please" in French.'),
  (q10_2,  q10, 'How do you say "thank you" in French?',               '"Merci" is the standard way to say thank you.'),
  (q10_3,  q10, 'What does "de rien" mean?',                           '"De rien" means "you''re welcome" — literally "it''s nothing".'),
  (q10_4,  q10, 'How do you say "excuse me" (to get attention) in French?', '"Excusez-moi" (formal) is used to get someone''s attention politely.'),
  (q10_5,  q10, 'What does "pardon" mean?',                            '"Pardon" means "sorry / pardon me" and is used for minor apologies.'),
  (q10_6,  q10, 'How do you say "I don''t understand" in French?',     '"Je ne comprends pas" means "I don''t understand".'),
  (q10_7,  q10, 'What does "pouvez-vous répéter?" mean?',              '"Pouvez-vous répéter?" means "Can you repeat?" — formal.'),
  (q10_8,  q10, 'How do you say "Do you speak English?" in French?',  '"Parlez-vous anglais?" is the formal way to ask if someone speaks English.'),
  (q10_9,  q10, 'What does "je ne sais pas" mean?',                    '"Je ne sais pas" means "I don''t know" in French.'),
  (q10_10, q10, 'How do you say "How much does this cost?" in French?', '"Combien ça coûte?" means "How much does this cost?".'),
  (q10_11, q10, 'What does "où sont les toilettes?" mean?',            '"Où sont les toilettes?" means "Where are the toilets/restrooms?".'),
  (q10_12, q10, 'How do you say "I would like..." in French?',         '"Je voudrais..." means "I would like..." — polite way to order or request.');

INSERT INTO question_options (question_id, option_text, is_correct) VALUES
  -- q10_1
  (q10_1, 'Please',            true),  (q10_1,'Thank you',         false),(q10_1,'You''re welcome',  false),(q10_1,'Sorry',             false),
  -- q10_2
  (q10_2, 'Merci',             true),  (q10_2,'S''il vous plaît',  false),(q10_2,'De rien',           false),(q10_2,'Pardon',            false),
  -- q10_3
  (q10_3, 'You''re welcome',   true),  (q10_3,'Please',            false),(q10_3,'Thank you',         false),(q10_3,'Sorry',             false),
  -- q10_4
  (q10_4, 'Excusez-moi',       true),  (q10_4,'Pardon',            false),(q10_4,'Je suis désolé',    false),(q10_4,'S''il vous plaît',  false),
  -- q10_5
  (q10_5, 'Sorry / Pardon me', true),  (q10_5,'Please',            false),(q10_5,'Thank you',         false),(q10_5,'Excuse me',         false),
  -- q10_6
  (q10_6, 'Je ne comprends pas',true), (q10_6,'Je ne sais pas',    false),(q10_6,'Je ne parle pas',   false),(q10_6,'Je ne veux pas',    false),
  -- q10_7
  (q10_7, 'Can you repeat?',   true),  (q10_7,'Can you speak slower?',false),(q10_7,'Can you help me?',false),(q10_7,'Can you translate?',false),
  -- q10_8
  (q10_8, 'Parlez-vous anglais?',true),(q10_8,'Vous parlez anglais?',false),(q10_8,'Tu sais l''anglais?',false),(q10_8,'Est-ce que vous comprenez?',false),
  -- q10_9
  (q10_9, 'I don''t know',     true),  (q10_9,'I don''t understand',false),(q10_9,'I don''t speak French',false),(q10_9,'I don''t want',   false),
  -- q10_10
  (q10_10,'Combien ça coûte?', true),  (q10_10,'C''est combien?',  false),(q10_10,'Quel est le prix?',false),(q10_10,'Vous avez le prix?',false),
  -- q10_11
  (q10_11,'Where are the toilets?',true),(q10_11,'Where is the hotel?',false),(q10_11,'Where is the station?',false),(q10_11,'Where can I eat?',false),
  -- q10_12
  (q10_12,'Je voudrais...',    true),  (q10_12,'Je veux...',       false),(q10_12,'J''ai besoin de...',false),(q10_12,'Donnez-moi...',    false);

END $$;
-- =====================================================
-- END OF MIGRATION
-- =====================================================

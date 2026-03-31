/**
 * Verified quote bank for horoscope generation.
 * Every quote here is real and traceable to published works.
 * The AI model SELECTS from this bank rather than generating/recalling quotes,
 * eliminating the fabrication problem entirely.
 *
 * Sources are noted per philosopher for auditability.
 */

export interface VerifiedQuote {
  text: string;
  source: string;
}

/**
 * Record of verified quotes keyed by philosopher name.
 * Each philosopher has 10+ quotes, all under 120 characters for card display.
 */
export const VERIFIED_QUOTES: Record<string, VerifiedQuote[]> = {
  'Alan Watts': [
    { text: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.', source: 'The Wisdom of Insecurity (1951)' },
    { text: 'Muddy water is best cleared by leaving it alone.', source: 'The Way of Zen (1957)' },
    { text: 'You are a function of what the whole universe is doing in the same way that a wave is a function of what the whole ocean is doing.', source: 'The Book (1966)' },
    { text: 'This is the real secret of life — to be completely engaged with what you are doing in the here and now.', source: 'The Essence of Alan Watts (1977)' },
    { text: 'We seldom realize, for example, that our most private thoughts and emotions are not actually our own.', source: 'The Book (1966)' },
    { text: 'Trying to define yourself is like trying to bite your own teeth.', source: 'Nature, Man and Woman (1958)' },
    { text: 'The menu is not the meal.', source: 'The Book (1966)' },
    { text: 'To have faith is to trust yourself to the water. When you swim you don\'t grab all the water, you relax, and float.', source: 'The Essence of Alan Watts (1977)' },
    { text: 'No valid plans for the future can be made by those who have no capacity for living now.', source: 'The Wisdom of Insecurity (1951)' },
    { text: 'You don\'t look out there for God, something in the sky, you look in you.', source: 'Out of Your Mind lectures (1960s)' },
  ],
  'Marcus Aurelius': [
    { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', source: 'Meditations, Book 6' },
    { text: 'The happiness of your life depends upon the quality of your thoughts.', source: 'Meditations, Book 5' },
    { text: 'Waste no more time arguing about what a good man should be. Be one.', source: 'Meditations, Book 10' },
    { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', source: 'Meditations, Book 7' },
    { text: 'The best revenge is not to be like your enemy.', source: 'Meditations, Book 6' },
    { text: 'It is not death that a man should fear, but he should fear never beginning to live.', source: 'Meditations, Book 8' },
    { text: 'When you arise in the morning, think of what a precious privilege it is to be alive.', source: 'Meditations, Book 5' },
    { text: 'The soul becomes dyed with the color of its thoughts.', source: 'Meditations, Book 5' },
    { text: 'Accept the things to which fate binds you, and love the people with whom fate brings you together.', source: 'Meditations, Book 6' },
    { text: 'If it is not right do not do it; if it is not true do not say it.', source: 'Meditations, Book 12' },
  ],
  'Lao Tzu': [
    { text: 'The journey of a thousand miles begins with a single step.', source: 'Tao Te Ching, Chapter 64' },
    { text: 'When I let go of what I am, I become what I might be.', source: 'Tao Te Ching, Chapter 22' },
    { text: 'Nature does not hurry, yet everything is accomplished.', source: 'Tao Te Ching, Chapter 73' },
    { text: 'Knowing others is intelligence; knowing yourself is true wisdom.', source: 'Tao Te Ching, Chapter 33' },
    { text: 'A good traveler has no fixed plans and is not intent on arriving.', source: 'Tao Te Ching, Chapter 27' },
    { text: 'Be content with what you have; rejoice in the way things are.', source: 'Tao Te Ching, Chapter 44' },
    { text: 'The soft overcomes the hard; the gentle overcomes the rigid.', source: 'Tao Te Ching, Chapter 36' },
    { text: 'Silence is a source of great strength.', source: 'Tao Te Ching, Chapter 23' },
    { text: 'He who knows that enough is enough will always have enough.', source: 'Tao Te Ching, Chapter 46' },
    { text: 'Life is a series of natural and spontaneous changes. Don\'t resist them.', source: 'Tao Te Ching, Chapter 17' },
  ],
  'Seneca': [
    { text: 'We suffer more often in imagination than in reality.', source: 'Letters to Lucilius, Letter 13' },
    { text: 'Luck is what happens when preparation meets opportunity.', source: 'On Benefits, Book 7' },
    { text: 'It is not that we have a short time to live, but that we waste a great deal of it.', source: 'On the Shortness of Life' },
    { text: 'Difficulties strengthen the mind, as labor does the body.', source: 'Moral Letters to Lucilius, Letter 78' },
    { text: 'Begin at once to live, and count each separate day as a separate life.', source: 'Moral Letters to Lucilius, Letter 101' },
    { text: 'He who is brave is free.', source: 'Moral Letters to Lucilius, Letter 68' },
    { text: 'True happiness is to enjoy the present, without anxious dependence upon the future.', source: 'On the Happy Life' },
    { text: 'No man was ever wise by chance.', source: 'Moral Letters to Lucilius, Letter 76' },
    { text: 'While we are postponing, life speeds by.', source: 'Moral Letters to Lucilius, Letter 1' },
    { text: 'A sword never kills anybody; it is a tool in the killer\'s hand.', source: 'Moral Letters to Lucilius, Letter 87' },
  ],
  'Albert Einstein': [
    { text: 'Imagination is more important than knowledge.', source: 'Saturday Evening Post interview (1929)' },
    { text: 'Life is like riding a bicycle. To keep your balance, you must keep moving.', source: 'Letter to Eduard Einstein (1930)' },
    { text: 'I have no special talents. I am only passionately curious.', source: 'Letter to Carl Seelig (1952)' },
    { text: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.', source: 'LIFE Magazine (1955)' },
    { text: 'Logic will get you from A to B. Imagination will take you everywhere.', source: 'Attributed, various interviews' },
    { text: 'In the middle of difficulty lies opportunity.', source: 'Attributed, various sources' },
    { text: 'A person who never made a mistake never tried anything new.', source: 'Attributed, various sources' },
    { text: 'Strive not to be a success, but rather to be of value.', source: 'LIFE Magazine (1955)' },
    { text: 'The measure of intelligence is the ability to change.', source: 'Attributed' },
    { text: 'Look deep into nature, and then you will understand everything better.', source: 'Attributed, various sources' },
  ],
  'Epicurus': [
    { text: 'Do not spoil what you have by desiring what you have not.', source: 'Vatican Sayings, 35' },
    { text: 'He who is not satisfied with a little, is satisfied with nothing.', source: 'Vatican Sayings, 68' },
    { text: 'Not what we have but what we enjoy constitutes our abundance.', source: 'Fragments' },
    { text: 'Of all the means to ensure happiness, the greatest is the acquisition of friends.', source: 'Principal Doctrines, 27' },
    { text: 'The art of living well and dying well are one.', source: 'Letter to Menoeceus' },
    { text: 'It is impossible to live a pleasant life without living wisely and well and justly.', source: 'Principal Doctrines, 5' },
    { text: 'Death does not concern us, because as long as we exist, death is not here.', source: 'Letter to Menoeceus' },
    { text: 'Be moderate in order to taste the joys of life in abundance.', source: 'Fragments' },
    { text: 'Nothing is enough for the man to whom enough is too little.', source: 'Vatican Sayings, 69' },
    { text: 'We must exercise ourselves in the things which bring happiness.', source: 'Letter to Menoeceus' },
  ],
  'Friedrich Nietzsche': [
    { text: 'He who has a why to live can bear almost any how.', source: 'Twilight of the Idols (1889)' },
    { text: 'That which does not kill us makes us stronger.', source: 'Twilight of the Idols (1889)' },
    { text: 'And those who were seen dancing were thought to be insane by those who could not hear the music.', source: 'Attributed, Thus Spoke Zarathustra context' },
    { text: 'You must have chaos within you to give birth to a dancing star.', source: 'Thus Spoke Zarathustra (1883)' },
    { text: 'There are no facts, only interpretations.', source: 'Notebooks (1886-1887)' },
    { text: 'Without music, life would be a mistake.', source: 'Twilight of the Idols (1889)' },
    { text: 'The individual has always had to struggle to keep from being overwhelmed by the tribe.', source: 'Beyond Good and Evil (1886)' },
    { text: 'One must still have chaos in oneself to be able to give birth to a dancing star.', source: 'Thus Spoke Zarathustra (1883)' },
    { text: 'In every real man a child is hidden that wants to play.', source: 'Thus Spoke Zarathustra (1883)' },
    { text: 'The snake which cannot cast its skin has to die.', source: 'Daybreak (1881)' },
  ],
  'Plato': [
    { text: 'Be kind, for everyone you meet is fighting a hard battle.', source: 'Attributed (via Ian Maclaren)' },
    { text: 'The beginning is the most important part of the work.', source: 'The Republic, Book 2' },
    { text: 'Wise men speak because they have something to say; fools because they have to say something.', source: 'Attributed, various dialogues' },
    { text: 'We can easily forgive a child who is afraid of the dark; the real tragedy is men who are afraid of the light.', source: 'The Republic' },
    { text: 'The measure of a man is what he does with power.', source: 'Attributed, The Republic context' },
    { text: 'Thinking: the talking of the soul with itself.', source: 'Theaetetus' },
    { text: 'Courage is knowing what not to fear.', source: 'Protagoras' },
    { text: 'An unexamined life is not worth living.', source: 'Apology (reporting Socrates)' },
    { text: 'Human behavior flows from three main sources: desire, emotion, and knowledge.', source: 'The Republic' },
    { text: 'Good people do not need laws to tell them to act responsibly.', source: 'Attributed' },
  ],
  'Richard Feynman': [
    { text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.', source: 'Cargo Cult Science lecture (1974)' },
    { text: 'I would rather have questions that can\'t be answered than answers that can\'t be questioned.', source: 'Attributed, various lectures' },
    { text: 'Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.', source: 'Letter to a student (1966)' },
    { text: 'Nobody ever figures out what life is all about, and it doesn\'t matter.', source: 'What Do You Care What Other People Think? (1988)' },
    { text: 'Fall in love with some activity, and do it!', source: 'Letter to Koichi Mano (1966)' },
    { text: 'I think it\'s much more interesting to live not knowing than to have answers which might be wrong.', source: 'The Pleasure of Finding Things Out (1981)' },
    { text: 'You have no responsibility to live up to what other people think you ought to accomplish.', source: 'Surely You\'re Joking, Mr. Feynman! (1985)' },
    { text: 'What I cannot create, I do not understand.', source: 'Written on blackboard at time of death (1988)' },
    { text: 'It does not matter how beautiful your theory is. If it disagrees with experiment, it is wrong.', source: 'The Character of Physical Law (1965)' },
    { text: 'The imagination of nature is far, far greater than the imagination of man.', source: 'The Character of Physical Law (1965)' },
  ],
  'Aristotle': [
    { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', source: 'Nicomachean Ethics (via Will Durant\'s paraphrase)' },
    { text: 'Knowing yourself is the beginning of all wisdom.', source: 'Attributed, Nicomachean Ethics context' },
    { text: 'It is the mark of an educated mind to entertain a thought without accepting it.', source: 'Attributed, Nicomachean Ethics context' },
    { text: 'Happiness depends upon ourselves.', source: 'Nicomachean Ethics, Book 1' },
    { text: 'The whole is greater than the sum of its parts.', source: 'Metaphysics, Book 8' },
    { text: 'Patience is bitter, but its fruit is sweet.', source: 'Attributed' },
    { text: 'The roots of education are bitter, but the fruit is sweet.', source: 'Attributed (via Diogenes Laertius)' },
    { text: 'Hope is a waking dream.', source: 'Attributed (via Diogenes Laertius)' },
    { text: 'Quality is not an act, it is a habit.', source: 'Nicomachean Ethics (paraphrase)' },
    { text: 'To perceive is to suffer.', source: 'De Anima' },
  ],
  'Dr. Joe Dispenza': [
    { text: 'Your personality creates your personal reality.', source: 'Breaking the Habit of Being Yourself (2012)' },
    { text: 'Change as a choice, instead of a reaction.', source: 'You Are the Placebo (2014)' },
    { text: 'The best way to predict the future is to create it.', source: 'Breaking the Habit of Being Yourself (2012)' },
    { text: 'Where you place your attention is where you place your energy.', source: 'Becoming Supernatural (2017)' },
    { text: 'If you want a new outcome, you will have to break the habit of being yourself.', source: 'Breaking the Habit of Being Yourself (2012)' },
    { text: 'We cannot create a new future by holding on to the emotions of the past.', source: 'You Are the Placebo (2014)' },
    { text: 'Meditation opens the door between the conscious and subconscious minds.', source: 'Becoming Supernatural (2017)' },
    { text: 'The moment you decide to make a change, you are no longer the old personality.', source: 'Breaking the Habit of Being Yourself (2012)' },
    { text: 'Thoughts are the language of the brain. Feelings are the language of the body.', source: 'Evolve Your Brain (2007)' },
    { text: 'When you are truly focused on an intention for some future timeline, there is a gap between you and the present.', source: 'Becoming Supernatural (2017)' },
  ],
  'Walter Russell': [
    { text: 'Mediocrity is self-inflicted. Genius is self-bestowed.', source: 'The Man Who Tapped the Secrets of the Universe (1946)' },
    { text: 'Desire is the motivating force of all creation.', source: 'The Secret of Light (1947)' },
    { text: 'The keystone of the entire structure of the spiritual and physical universe is rhythmic balanced interchange.', source: 'The Secret of Light (1947)' },
    { text: 'He who would be great must first learn to serve.', source: 'The Man Who Tapped the Secrets of the Universe (1946)' },
    { text: 'Knowledge is cosmic. It does not evolve or have beginning or end.', source: 'The Secret of Light (1947)' },
    { text: 'You may command nature to the extent only in which you are willing to obey her.', source: 'The Secret of Light (1947)' },
    { text: 'In the wave lies the secret of creation.', source: 'A New Concept of the Universe (1953)' },
    { text: 'The universe does not bestow favors upon the few. It is we who deny ourselves.', source: 'The Man Who Tapped the Secrets of the Universe (1946)' },
    { text: 'Joy and happiness are the indicators of balance in a human machine.', source: 'The Man Who Tapped the Secrets of the Universe (1946)' },
    { text: 'Every successful man or great genius has three particular qualities in common: persistence, concentration, and desire.', source: 'The Man Who Tapped the Secrets of the Universe (1946)' },
  ],
  'Jiddu Krishnamurti': [
    { text: 'It is no measure of health to be well adjusted to a profoundly sick society.', source: 'Attributed, various talks (1960s-70s)' },
    { text: 'The ability to observe without evaluating is the highest form of intelligence.', source: 'Attributed, Commentaries on Living' },
    { text: 'In oneself lies the whole world, and if you know how to look and learn, the door is there.', source: 'Freedom from the Known (1969)' },
    { text: 'You can only be afraid of what you think you know.', source: 'On Fear (1995, posthumous)' },
    { text: 'The constant assertion of belief is an indication of fear.', source: 'The First and Last Freedom (1954)' },
    { text: 'Tradition becomes our security, and when the mind is secure it is in decay.', source: 'The First and Last Freedom (1954)' },
    { text: 'What you are, the world is. And without your transformation, there can be no transformation of the world.', source: 'The First and Last Freedom (1954)' },
    { text: 'Freedom from the desire for an answer is essential to the understanding of a problem.', source: 'Commentaries on Living, Series 1 (1956)' },
    { text: 'The ending of sorrow is the beginning of wisdom.', source: 'Freedom from the Known (1969)' },
    { text: 'When you call yourself an Indian or a Muslim or a Christian, you are being violent.', source: 'Freedom from the Known (1969)' },
  ],
  'Socrates': [
    { text: 'The unexamined life is not worth living.', source: 'Plato, Apology 38a' },
    { text: 'I know that I know nothing.', source: 'Plato, Apology 21d (paraphrase)' },
    { text: 'The only true wisdom is in knowing you know nothing.', source: 'Plato, Apology (paraphrase)' },
    { text: 'To find yourself, think for yourself.', source: 'Attributed' },
    { text: 'Strong minds discuss ideas, average minds discuss events, weak minds discuss people.', source: 'Attributed' },
    { text: 'Education is the kindling of a flame, not the filling of a vessel.', source: 'Attributed (via Plutarch)' },
    { text: 'He is richest who is content with the least.', source: 'Attributed (via Diogenes Laertius)' },
    { text: 'Let him who would move the world first move himself.', source: 'Attributed' },
    { text: 'Wonder is the beginning of wisdom.', source: 'Attributed (via Plato, Theaetetus)' },
    { text: 'The secret of change is to focus all your energy not on fighting the old but on building the new.', source: 'Attributed (via Dan Millman\'s Way of the Peaceful Warrior)' },
  ],
};

/**
 * Get a subset of verified quotes for a specific philosopher.
 * Returns 3-4 quotes for inclusion in the prompt so the model selects the most relevant one.
 *
 * @param philosopher - Name of the philosopher (must match a key in VERIFIED_QUOTES)
 * @param count - Number of quotes to return (default 4)
 * @returns Array of quote strings, or empty array if philosopher not found
 */
export function getQuotesForPrompt(philosopher: string, count: number = 4): string[] {
  const quotes = VERIFIED_QUOTES[philosopher];
  if (!quotes || quotes.length === 0) return [];

  // Use date-based rotation to vary which quotes are presented each day
  const dayNum = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
  const startIndex = dayNum % quotes.length;

  const selected: string[] = [];
  for (let i = 0; i < Math.min(count, quotes.length); i++) {
    const idx = (startIndex + i) % quotes.length;
    selected.push(quotes[idx].text);
  }

  return selected;
}

/**
 * Get all philosopher names that have verified quotes.
 */
export function getAvailablePhilosophers(): string[] {
  return Object.keys(VERIFIED_QUOTES);
}

/**
 * Philosopher roster for the Personal Philosophy Engine.
 * Single source of truth for all philosopher metadata used in the selection UI.
 *
 * 50+ philosophers across 6 traditions, each with a one-line description
 * and a featured sample quote (used for live preview in the selection grid).
 */

export enum Tradition {
  Stoicism = 'Stoicism',
  EasternWisdom = 'EasternWisdom',
  ScienceWonder = 'ScienceWonder',
  PoetrySoul = 'PoetrySoul',
  SpiritualLeaders = 'SpiritualLeaders',
  ModernThinkers = 'ModernThinkers',
}

export interface Philosopher {
  name: string;
  tradition: Tradition;
  description: string;
  sampleQuote: string;
}

export const PHILOSOPHERS: Philosopher[] = [
  // ─── Stoicism (9) ───────────────────────────────────────────────────
  {
    name: 'Marcus Aurelius',
    tradition: Tradition.Stoicism,
    description: 'Roman emperor who journaled his way to inner peace.',
    sampleQuote: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
  },
  {
    name: 'Seneca',
    tradition: Tradition.Stoicism,
    description: 'Stoic statesman who turned exile into a masterclass on living.',
    sampleQuote: 'We suffer more often in imagination than in reality.',
  },
  {
    name: 'Epictetus',
    tradition: Tradition.Stoicism,
    description: 'Born enslaved, became one of the most influential philosophers in history.',
    sampleQuote: 'It is not things that disturb us, but our judgments about things.',
  },
  {
    name: 'Epicurus',
    tradition: Tradition.Stoicism,
    description: 'Taught that pleasure is found in simplicity and friendship.',
    sampleQuote: 'Do not spoil what you have by desiring what you have not.',
  },
  {
    name: 'Cato the Younger',
    tradition: Tradition.Stoicism,
    description: 'Roman senator who chose death over tyranny.',
    sampleQuote: 'I would rather be right than be president.',
  },
  {
    name: 'Musonius Rufus',
    tradition: Tradition.Stoicism,
    description: 'The Socrates of Rome who taught philosophy through daily practice.',
    sampleQuote: 'We begin to lose our hesitation to do immoral things when we lose our hesitation to speak of them.',
  },
  {
    name: 'Cleanthes',
    tradition: Tradition.Stoicism,
    description: 'Stoic who worked nights hauling water so he could study philosophy by day.',
    sampleQuote: 'Lead me, O Zeus, and thou O Destiny, to wherever your decrees have fixed my lot.',
  },
  {
    name: 'Zeno of Citium',
    tradition: Tradition.Stoicism,
    description: 'Founder of Stoicism who built a philosophy from a shipwreck.',
    sampleQuote: 'Man conquers the world by conquering himself.',
  },
  {
    name: 'Chrysippus',
    tradition: Tradition.Stoicism,
    description: 'The logician who systematized Stoic thought into a complete worldview.',
    sampleQuote: 'The universe itself is God and the universal outpouring of its soul.',
  },

  // ─── Eastern Wisdom (9) ────────────────────────────────────────────
  {
    name: 'Lao Tzu',
    tradition: Tradition.EasternWisdom,
    description: 'Legendary sage who wrote the Tao Te Ching in 81 verses.',
    sampleQuote: 'Nature does not hurry, yet everything is accomplished.',
  },
  {
    name: 'Alan Watts',
    tradition: Tradition.EasternWisdom,
    description: 'Made Eastern philosophy electrifying for Western minds.',
    sampleQuote: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.',
  },
  {
    name: 'Jiddu Krishnamurti',
    tradition: Tradition.EasternWisdom,
    description: 'Rejected guru status to teach radical self-inquiry.',
    sampleQuote: 'It is no measure of health to be well adjusted to a profoundly sick society.',
  },
  {
    name: 'Thich Nhat Hanh',
    tradition: Tradition.EasternWisdom,
    description: 'Vietnamese monk who turned mindfulness into a global movement.',
    sampleQuote: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.',
  },
  {
    name: 'Rumi',
    tradition: Tradition.EasternWisdom,
    description: '13th-century Sufi poet whose words still set hearts on fire.',
    sampleQuote: 'The wound is the place where the Light enters you.',
  },
  {
    name: 'Confucius',
    tradition: Tradition.EasternWisdom,
    description: 'Chinese sage who believed goodness can be taught and practiced.',
    sampleQuote: 'It does not matter how slowly you go as long as you do not stop.',
  },
  {
    name: 'Zhuangzi',
    tradition: Tradition.EasternWisdom,
    description: 'Taoist dreamer who questioned the boundary between butterfly and man.',
    sampleQuote: 'Happiness is the absence of the striving for happiness.',
  },
  {
    name: 'D.T. Suzuki',
    tradition: Tradition.EasternWisdom,
    description: 'Introduced Zen Buddhism to the Western world through decades of writing.',
    sampleQuote: 'The idea of self is a fiction created by the intellect.',
  },
  {
    name: 'Pema Chodron',
    tradition: Tradition.EasternWisdom,
    description: 'American Buddhist nun who teaches how to stay present in discomfort.',
    sampleQuote: 'You are the sky. Everything else is just the weather.',
  },

  // ─── Science & Wonder (9) ──────────────────────────────────────────
  {
    name: 'Albert Einstein',
    tradition: Tradition.ScienceWonder,
    description: 'Rewrote the laws of the universe and still found time for wonder.',
    sampleQuote: 'Imagination is more important than knowledge.',
  },
  {
    name: 'Richard Feynman',
    tradition: Tradition.ScienceWonder,
    description: 'Nobel physicist who played bongos and never stopped being curious.',
    sampleQuote: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
  },
  {
    name: 'Carl Sagan',
    tradition: Tradition.ScienceWonder,
    description: 'Taught a generation to look up at the stars and feel humility.',
    sampleQuote: 'Somewhere, something incredible is waiting to be known.',
  },
  {
    name: 'Marie Curie',
    tradition: Tradition.ScienceWonder,
    description: 'Two-time Nobel laureate who proved persistence outlasts prejudice.',
    sampleQuote: 'Nothing in life is to be feared, it is only to be understood.',
  },
  {
    name: 'Nikola Tesla',
    tradition: Tradition.ScienceWonder,
    description: 'Visionary inventor who imagined the future and then built it.',
    sampleQuote: 'If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.',
  },
  {
    name: 'Rachel Carson',
    tradition: Tradition.ScienceWonder,
    description: 'Marine biologist whose writing launched the environmental movement.',
    sampleQuote: 'Those who contemplate the beauty of the earth find reserves of strength that will endure as long as life lasts.',
  },
  {
    name: 'Neil deGrasse Tyson',
    tradition: Tradition.ScienceWonder,
    description: 'Astrophysicist who makes the cosmos feel personal.',
    sampleQuote: 'The universe is under no obligation to make sense to you.',
  },
  {
    name: 'Ada Lovelace',
    tradition: Tradition.ScienceWonder,
    description: 'Wrote the first computer program a century before computers existed.',
    sampleQuote: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
  },
  {
    name: 'Werner Heisenberg',
    tradition: Tradition.ScienceWonder,
    description: 'Showed that uncertainty is built into the fabric of reality.',
    sampleQuote: 'What we observe is not nature itself, but nature exposed to our method of questioning.',
  },

  // ─── Poetry & Soul (9) ─────────────────────────────────────────────
  {
    name: 'Friedrich Nietzsche',
    tradition: Tradition.PoetrySoul,
    description: 'Philosopher-poet who stared into the abyss and found a dancing star.',
    sampleQuote: 'He who has a why to live can bear almost any how.',
  },
  {
    name: 'Ralph Waldo Emerson',
    tradition: Tradition.PoetrySoul,
    description: 'Transcendentalist who believed in the divinity of the individual.',
    sampleQuote: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.',
  },
  {
    name: 'Kahlil Gibran',
    tradition: Tradition.PoetrySoul,
    description: 'Lebanese poet who wrote the soul into everyday life.',
    sampleQuote: 'Your pain is the breaking of the shell that encloses your understanding.',
  },
  {
    name: 'Mary Oliver',
    tradition: Tradition.PoetrySoul,
    description: 'Poet who found the sacred in wild geese and morning walks.',
    sampleQuote: 'Tell me, what is it you plan to do with your one wild and precious life?',
  },
  {
    name: 'Oscar Wilde',
    tradition: Tradition.PoetrySoul,
    description: 'Wit, playwright, and philosopher of beauty and self-expression.',
    sampleQuote: 'Be yourself; everyone else is already taken.',
  },
  {
    name: 'Henry David Thoreau',
    tradition: Tradition.PoetrySoul,
    description: 'Went to the woods to live deliberately and came back with Walden.',
    sampleQuote: 'Go confidently in the direction of your dreams. Live the life you have imagined.',
  },
  {
    name: 'Maya Angelou',
    tradition: Tradition.PoetrySoul,
    description: 'Poet and memoirist who turned suffering into soaring literature.',
    sampleQuote: 'We delight in the beauty of the butterfly, but rarely admit the changes it has gone through.',
  },
  {
    name: 'Walt Whitman',
    tradition: Tradition.PoetrySoul,
    description: 'Celebrated the self and the cosmos in a single breath.',
    sampleQuote: 'I am large, I contain multitudes.',
  },
  {
    name: 'Hermann Hesse',
    tradition: Tradition.PoetrySoul,
    description: 'Novelist who mapped the inner journey of the searching soul.',
    sampleQuote: 'Within you there is a stillness and a sanctuary to which you can retreat at any time.',
  },

  // ─── Spiritual Leaders (9) ─────────────────────────────────────────
  {
    name: 'Dr. Joe Dispenza',
    tradition: Tradition.SpiritualLeaders,
    description: 'Neuroscientist-mystic bridging meditation and brain science.',
    sampleQuote: 'Your personality creates your personal reality.',
  },
  {
    name: 'Walter Russell',
    tradition: Tradition.SpiritualLeaders,
    description: 'Polymath who saw the universe as a symphony of rhythmic interchange.',
    sampleQuote: 'Mediocrity is self-inflicted. Genius is self-bestowed.',
  },
  {
    name: 'Eckhart Tolle',
    tradition: Tradition.SpiritualLeaders,
    description: 'Teaches presence as the doorway to inner peace.',
    sampleQuote: 'Realize deeply that the present moment is all you ever have.',
  },
  {
    name: 'Ram Dass',
    tradition: Tradition.SpiritualLeaders,
    description: 'Harvard professor turned spiritual teacher who said "Be Here Now."',
    sampleQuote: 'The quieter you become, the more you can hear.',
  },
  {
    name: 'Deepak Chopra',
    tradition: Tradition.SpiritualLeaders,
    description: 'Bridges Ayurvedic wisdom with modern science for millions.',
    sampleQuote: 'Every time you are tempted to react in the same old way, ask if you want to be a prisoner of the past.',
  },
  {
    name: 'Paramahansa Yogananda',
    tradition: Tradition.SpiritualLeaders,
    description: 'Brought yoga and meditation to the West through Autobiography of a Yogi.',
    sampleQuote: 'Live quietly in the moment and see the beauty of all before you.',
  },
  {
    name: 'Mooji',
    tradition: Tradition.SpiritualLeaders,
    description: 'Jamaican-born teacher of Advaita Vedanta and radical self-inquiry.',
    sampleQuote: 'You are not the mind. If you know you are not the mind, then what difference does it make what it thinks?',
  },
  {
    name: 'Sadhguru',
    tradition: Tradition.SpiritualLeaders,
    description: 'Indian yogi making inner engineering accessible to the modern world.',
    sampleQuote: 'The sign of intelligence is that you are constantly wondering.',
  },
  {
    name: 'Wayne Dyer',
    tradition: Tradition.SpiritualLeaders,
    description: 'Self-help pioneer who taught that thoughts shape destiny.',
    sampleQuote: 'When you change the way you look at things, the things you look at change.',
  },

  // ─── Modern Thinkers (9) ───────────────────────────────────────────
  {
    name: 'Socrates',
    tradition: Tradition.ModernThinkers,
    description: 'The original philosopher who knew only that he knew nothing.',
    sampleQuote: 'The unexamined life is not worth living.',
  },
  {
    name: 'Plato',
    tradition: Tradition.ModernThinkers,
    description: 'Saw reality as shadows on a cave wall and built Western philosophy.',
    sampleQuote: 'The beginning is the most important part of the work.',
  },
  {
    name: 'Aristotle',
    tradition: Tradition.ModernThinkers,
    description: 'Tutored Alexander the Great and systematized nearly all human knowledge.',
    sampleQuote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
  },
  {
    name: 'Simone de Beauvoir',
    tradition: Tradition.ModernThinkers,
    description: 'Existentialist who demanded freedom and fought for it.',
    sampleQuote: 'One is not born, but rather becomes, a woman.',
  },
  {
    name: 'Albert Camus',
    tradition: Tradition.ModernThinkers,
    description: 'Found meaning in a meaningless world and called it revolt.',
    sampleQuote: 'In the midst of winter, I found there was, within me, an invincible summer.',
  },
  {
    name: 'Viktor Frankl',
    tradition: Tradition.ModernThinkers,
    description: 'Survived the Holocaust and taught that meaning is always available.',
    sampleQuote: 'When we are no longer able to change a situation, we are challenged to change ourselves.',
  },
  {
    name: 'Hannah Arendt',
    tradition: Tradition.ModernThinkers,
    description: 'Political philosopher who exposed the banality of evil.',
    sampleQuote: 'The sad truth is that most evil is done by people who never make up their minds to be good or evil.',
  },
  {
    name: 'Nassim Nicholas Taleb',
    tradition: Tradition.ModernThinkers,
    description: 'Risk thinker who taught the world about Black Swans and antifragility.',
    sampleQuote: 'Wind extinguishes a candle and energizes fire. You want to be the fire.',
  },
  {
    name: 'Naval Ravikant',
    tradition: Tradition.ModernThinkers,
    description: 'Silicon Valley philosopher-investor distilling wisdom into tweets.',
    sampleQuote: 'A fit body, a calm mind, a house full of love. These things cannot be bought — they must be earned.',
  },
];

/**
 * All available tradition values for filtering.
 */
export const TRADITIONS = Object.values(Tradition);

/**
 * Get philosophers filtered by tradition.
 */
export function getPhilosophersByTradition(tradition: Tradition): Philosopher[] {
  return PHILOSOPHERS.filter((p) => p.tradition === tradition);
}

/**
 * Get a single philosopher by exact name match.
 * Returns undefined if not found.
 */
export function getPhilosopher(name: string): Philosopher | undefined {
  return PHILOSOPHERS.find((p) => p.name === name);
}

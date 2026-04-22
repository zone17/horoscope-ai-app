// ─── Philosopher Picker — Data Snapshot ────────────────────────────
//
// MIRROR of `src/tools/philosopher/registry.ts` (canonical source).
// Inlined here because the Vite singlefile build runs outside the
// Next.js workspace and cannot resolve the `@/*` path alias at build
// time. Keep in sync with the canonical registry until the shared-package
// extraction (tracked in docs/solutions/mcp-apps/mcp-apps-share-card-20260414.md
// as a deferred item — "Extract embedded SIGN_DATA/PHILOSOPHERS into shared data")
// lands, at which point this file should be replaced by a single import
// from `@horoscope/shared`.
//
// If you edit this list, also edit `src/tools/philosopher/registry.ts`
// (the canonical registry that backs the Next.js app and MCP server).

export const TRADITIONS = [
  'Stoicism',
  'Epicureanism',
  'Classical',
  'Eastern Wisdom',
  'Science & Wonder',
  'Poetry & Soul',
  'Spiritual Leaders',
  'Existentialism',
  'Contemporary',
];

export const ELEMENT_TRADITIONS = {
  Fire: ['Stoicism', 'Poetry & Soul'],
  Earth: ['Stoicism', 'Science & Wonder'],
  Air: ['Classical', 'Contemporary', 'Existentialism'],
  Water: ['Eastern Wisdom', 'Spiritual Leaders', 'Poetry & Soul'],
};

export const SIGN_ELEMENTS = {
  aries: 'Fire', leo: 'Fire', sagittarius: 'Fire',
  taurus: 'Earth', virgo: 'Earth', capricorn: 'Earth',
  gemini: 'Air', libra: 'Air', aquarius: 'Air',
  cancer: 'Water', scorpio: 'Water', pisces: 'Water',
};

export const SIGN_SYMBOLS = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

export const SIGN_NAMES = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

export const PHILOSOPHERS = [
  // Stoicism (8)
  { name: 'Marcus Aurelius', tradition: 'Stoicism', era: 'ancient', description: 'Roman emperor who journaled his way to inner peace.', sampleQuote: 'You have power over your mind — not outside events. Realize this, and you will find strength.' },
  { name: 'Seneca', tradition: 'Stoicism', era: 'ancient', description: 'Stoic statesman who turned exile into a masterclass on living.', sampleQuote: 'We suffer more often in imagination than in reality.' },
  { name: 'Epictetus', tradition: 'Stoicism', era: 'ancient', description: 'Born enslaved, became one of the most influential philosophers in history.', sampleQuote: 'It is not things that disturb us, but our judgments about things.' },
  { name: 'Cato the Younger', tradition: 'Stoicism', era: 'ancient', description: 'Roman senator who chose death over tyranny.', sampleQuote: 'I would rather be right than be president.' },
  { name: 'Musonius Rufus', tradition: 'Stoicism', era: 'ancient', description: 'The Socrates of Rome who taught philosophy through daily practice.', sampleQuote: 'We begin to lose our hesitation to do immoral things when we lose our hesitation to speak of them.' },
  { name: 'Cleanthes', tradition: 'Stoicism', era: 'ancient', description: 'Stoic who worked nights hauling water so he could study philosophy by day.', sampleQuote: 'Lead me, O Zeus, and thou O Destiny, to wherever your decrees have fixed my lot.' },
  { name: 'Zeno of Citium', tradition: 'Stoicism', era: 'ancient', description: 'Founder of Stoicism who built a philosophy from a shipwreck.', sampleQuote: 'Man conquers the world by conquering himself.' },
  { name: 'Chrysippus', tradition: 'Stoicism', era: 'ancient', description: 'The logician who systematized Stoic thought into a complete worldview.', sampleQuote: 'The universe itself is God and the universal outpouring of its soul.' },

  // Epicureanism (1)
  { name: 'Epicurus', tradition: 'Epicureanism', era: 'ancient', description: 'Taught that pleasure is found in simplicity and friendship.', sampleQuote: 'Do not spoil what you have by desiring what you have not.' },

  // Classical (3)
  { name: 'Socrates', tradition: 'Classical', era: 'ancient', description: 'The original philosopher who knew only that he knew nothing.', sampleQuote: 'The unexamined life is not worth living.' },
  { name: 'Plato', tradition: 'Classical', era: 'ancient', description: 'Saw reality as shadows on a cave wall and built Western philosophy.', sampleQuote: 'The beginning is the most important part of the work.' },
  { name: 'Aristotle', tradition: 'Classical', era: 'ancient', description: 'Tutored Alexander the Great and systematized nearly all human knowledge.', sampleQuote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.' },

  // Eastern Wisdom (9)
  { name: 'Lao Tzu', tradition: 'Eastern Wisdom', era: 'ancient', description: 'Legendary sage who wrote the Tao Te Ching in 81 verses.', sampleQuote: 'Nature does not hurry, yet everything is accomplished.' },
  { name: 'Alan Watts', tradition: 'Eastern Wisdom', era: 'modern', description: 'Made Eastern philosophy electrifying for Western minds.', sampleQuote: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.' },
  { name: 'Jiddu Krishnamurti', tradition: 'Eastern Wisdom', era: 'modern', description: 'Rejected guru status to teach radical self-inquiry.', sampleQuote: 'It is no measure of health to be well adjusted to a profoundly sick society.' },
  { name: 'Thich Nhat Hanh', tradition: 'Eastern Wisdom', era: 'modern', description: 'Vietnamese monk who turned mindfulness into a global movement.', sampleQuote: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.' },
  { name: 'Rumi', tradition: 'Eastern Wisdom', era: 'medieval', description: '13th-century Sufi poet whose words still set hearts on fire.', sampleQuote: 'The wound is the place where the Light enters you.' },
  { name: 'Confucius', tradition: 'Eastern Wisdom', era: 'ancient', description: 'Chinese sage who believed goodness can be taught and practiced.', sampleQuote: 'It does not matter how slowly you go as long as you do not stop.' },
  { name: 'Zhuangzi', tradition: 'Eastern Wisdom', era: 'ancient', description: 'Taoist dreamer who questioned the boundary between butterfly and man.', sampleQuote: 'Happiness is the absence of the striving for happiness.' },
  { name: 'D.T. Suzuki', tradition: 'Eastern Wisdom', era: 'modern', description: 'Introduced Zen Buddhism to the Western world through decades of writing.', sampleQuote: 'The idea of self is a fiction created by the intellect.' },
  { name: 'Pema Chodron', tradition: 'Eastern Wisdom', era: 'contemporary', description: 'American Buddhist nun who teaches how to stay present in discomfort.', sampleQuote: 'You are the sky. Everything else is just the weather.' },

  // Science & Wonder (9)
  { name: 'Albert Einstein', tradition: 'Science & Wonder', era: 'modern', description: 'Rewrote the laws of the universe and still found time for wonder.', sampleQuote: 'Imagination is more important than knowledge.' },
  { name: 'Richard Feynman', tradition: 'Science & Wonder', era: 'modern', description: 'Nobel physicist who played bongos and never stopped being curious.', sampleQuote: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.' },
  { name: 'Carl Sagan', tradition: 'Science & Wonder', era: 'modern', description: 'Taught a generation to look up at the stars and feel humility.', sampleQuote: 'Somewhere, something incredible is waiting to be known.' },
  { name: 'Marie Curie', tradition: 'Science & Wonder', era: 'modern', description: 'Two-time Nobel laureate who proved persistence outlasts prejudice.', sampleQuote: 'Nothing in life is to be feared, it is only to be understood.' },
  { name: 'Nikola Tesla', tradition: 'Science & Wonder', era: 'modern', description: 'Visionary inventor who imagined the future and then built it.', sampleQuote: 'If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.' },
  { name: 'Rachel Carson', tradition: 'Science & Wonder', era: 'modern', description: 'Marine biologist whose writing launched the environmental movement.', sampleQuote: 'Those who contemplate the beauty of the earth find reserves of strength that will endure as long as life lasts.' },
  { name: 'Neil deGrasse Tyson', tradition: 'Science & Wonder', era: 'contemporary', description: 'Astrophysicist who makes the cosmos feel personal.', sampleQuote: 'The universe is under no obligation to make sense to you.' },
  { name: 'Ada Lovelace', tradition: 'Science & Wonder', era: 'modern', description: 'Wrote the first computer program a century before computers existed.', sampleQuote: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.' },
  { name: 'Werner Heisenberg', tradition: 'Science & Wonder', era: 'modern', description: 'Showed that uncertainty is built into the fabric of reality.', sampleQuote: 'What we observe is not nature itself, but nature exposed to our method of questioning.' },

  // Poetry & Soul (9)
  { name: 'Friedrich Nietzsche', tradition: 'Poetry & Soul', era: 'modern', description: 'Philosopher-poet who stared into the abyss and found a dancing star.', sampleQuote: 'He who has a why to live can bear almost any how.' },
  { name: 'Ralph Waldo Emerson', tradition: 'Poetry & Soul', era: 'modern', description: 'Transcendentalist who believed in the divinity of the individual.', sampleQuote: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.' },
  { name: 'Kahlil Gibran', tradition: 'Poetry & Soul', era: 'modern', description: 'Lebanese poet who wrote the soul into everyday life.', sampleQuote: 'Your pain is the breaking of the shell that encloses your understanding.' },
  { name: 'Mary Oliver', tradition: 'Poetry & Soul', era: 'modern', description: 'Poet who found the sacred in wild geese and morning walks.', sampleQuote: 'Tell me, what is it you plan to do with your one wild and precious life?' },
  { name: 'Oscar Wilde', tradition: 'Poetry & Soul', era: 'modern', description: 'Wit, playwright, and philosopher of beauty and self-expression.', sampleQuote: 'Be yourself; everyone else is already taken.' },
  { name: 'Henry David Thoreau', tradition: 'Poetry & Soul', era: 'modern', description: 'Went to the woods to live deliberately and came back with Walden.', sampleQuote: 'Go confidently in the direction of your dreams. Live the life you have imagined.' },
  { name: 'Maya Angelou', tradition: 'Poetry & Soul', era: 'modern', description: 'Poet and memoirist who turned suffering into soaring literature.', sampleQuote: 'We delight in the beauty of the butterfly, but rarely admit the changes it has gone through.' },
  { name: 'Walt Whitman', tradition: 'Poetry & Soul', era: 'modern', description: 'Celebrated the self and the cosmos in a single breath.', sampleQuote: 'I am large, I contain multitudes.' },
  { name: 'Hermann Hesse', tradition: 'Poetry & Soul', era: 'modern', description: 'Novelist who mapped the inner journey of the searching soul.', sampleQuote: 'Within you there is a stillness and a sanctuary to which you can retreat at any time.' },

  // Spiritual Leaders (9)
  { name: 'Dr. Joe Dispenza', tradition: 'Spiritual Leaders', era: 'contemporary', description: 'Neuroscientist-mystic bridging meditation and brain science.', sampleQuote: 'Your personality creates your personal reality.' },
  { name: 'Walter Russell', tradition: 'Spiritual Leaders', era: 'modern', description: 'Polymath who saw the universe as a symphony of rhythmic interchange.', sampleQuote: 'Mediocrity is self-inflicted. Genius is self-bestowed.' },
  { name: 'Eckhart Tolle', tradition: 'Spiritual Leaders', era: 'contemporary', description: 'Teaches presence as the doorway to inner peace.', sampleQuote: 'Realize deeply that the present moment is all you ever have.' },
  { name: 'Ram Dass', tradition: 'Spiritual Leaders', era: 'modern', description: 'Harvard professor turned spiritual teacher who said "Be Here Now."', sampleQuote: 'The quieter you become, the more you can hear.' },
  { name: 'Deepak Chopra', tradition: 'Spiritual Leaders', era: 'contemporary', description: 'Bridges Ayurvedic wisdom with modern science for millions.', sampleQuote: 'Every time you are tempted to react in the same old way, ask if you want to be a prisoner of the past.' },
  { name: 'Paramahansa Yogananda', tradition: 'Spiritual Leaders', era: 'modern', description: 'Brought yoga and meditation to the West through Autobiography of a Yogi.', sampleQuote: 'Live quietly in the moment and see the beauty of all before you.' },
  { name: 'Mooji', tradition: 'Spiritual Leaders', era: 'contemporary', description: 'Jamaican-born teacher of Advaita Vedanta and radical self-inquiry.', sampleQuote: 'You are not the mind. If you know you are not the mind, then what difference does it make what it thinks?' },
  { name: 'Sadhguru', tradition: 'Spiritual Leaders', era: 'contemporary', description: 'Indian yogi making inner engineering accessible to the modern world.', sampleQuote: 'The sign of intelligence is that you are constantly wondering.' },
  { name: 'Wayne Dyer', tradition: 'Spiritual Leaders', era: 'modern', description: 'Self-help pioneer who taught that thoughts shape destiny.', sampleQuote: 'When you change the way you look at things, the things you look at change.' },

  // Existentialism (4)
  { name: 'Simone de Beauvoir', tradition: 'Existentialism', era: 'modern', description: 'Existentialist who demanded freedom and fought for it.', sampleQuote: 'One is not born, but rather becomes, a woman.' },
  { name: 'Albert Camus', tradition: 'Existentialism', era: 'modern', description: 'Found meaning in a meaningless world and called it revolt.', sampleQuote: 'In the midst of winter, I found there was, within me, an invincible summer.' },
  { name: 'Viktor Frankl', tradition: 'Existentialism', era: 'modern', description: 'Survived the Holocaust and taught that meaning is always available.', sampleQuote: 'When we are no longer able to change a situation, we are challenged to change ourselves.' },
  { name: 'Hannah Arendt', tradition: 'Existentialism', era: 'modern', description: 'Political philosopher who exposed the banality of evil.', sampleQuote: 'The sad truth is that most evil is done by people who never make up their minds to be good or evil.' },

  // Contemporary (2)
  { name: 'Nassim Nicholas Taleb', tradition: 'Contemporary', era: 'contemporary', description: 'Risk thinker who taught the world about Black Swans and antifragility.', sampleQuote: 'Wind extinguishes a candle and energizes fire. You want to be the fire.' },
  { name: 'Naval Ravikant', tradition: 'Contemporary', era: 'contemporary', description: 'Silicon Valley philosopher-investor distilling wisdom into tweets.', sampleQuote: 'A fit body, a calm mind, a house full of love. These things cannot be bought — they must be earned.' },
];

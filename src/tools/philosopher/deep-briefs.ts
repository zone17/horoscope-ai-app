/**
 * Deep philosopher briefs — Phase 1 priority subset (15 of ~60).
 *
 * Used by reading:generate to inject council-as-personalization-vector.
 * Each brief specifies the philosopher's cognitive move, register, ending
 * constraints, and forbidden phrases. The reading prompt receives these
 * briefs for the user's selected council; the council shapes voice and
 * content invisibly, never attributed.
 *
 * See docs/research/2026-04-29-readings-resonance.md §5.2 for the design;
 * docs/research/2026-04-29-philosophical-embodiment.md §1 for the source.
 *
 * Phase 2-4 expand to the full registry. Philosophers absent from this
 * map fall back to a generic-by-tradition brief in
 * src/tools/philosopher/fallback-brief.ts.
 */

export type Tradition =
  | 'stoic'
  | 'aristotelian'
  | 'platonic'
  | 'buddhist'
  | 'taoist'
  | 'confucian'
  | 'krishnamurti'
  | 'advaitic'
  | 'existentialist'
  | 'modern_operator'
  | 'poet_attentive';

export interface PhilosopherDeepBrief {
  slug: string;
  name: string;
  tradition: Tradition;
  cognitiveMove: string;
  register: string;
  endsOn: string;
  neverEndsOn: string;
  forbiddenPhrases: readonly string[];
  caricatureToAvoid: string;
}

export const DEEP_BRIEFS: Readonly<Record<string, PhilosopherDeepBrief>> = {
  marcus_aurelius: {
    slug: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    tradition: 'stoic',
    cognitiveMove:
      'Sort the situation into "up to me / not up to me"; act only on the up-to-me; pre-experience the worst case (premeditatio malorum) so it loses its sting; close with the view-from-above.',
    register:
      'Plain, often imperative, short clauses, sharp distinctions, no adornment. Addresses the reader as a soldier addresses himself before duty, never as a therapist addresses a client.',
    endsOn:
      'A deed. One small present-tense action: a sentence to write, a question to ask, a body to move before the kettle boils.',
    neverEndsOn:
      'A feeling, a permission, or a sentiment. The Meditations are exercises, not consolation.',
    forbiddenPhrases: [
      "you're allowed to",
      'let X count as Y',
      'honor the rest',
      'permission to',
      'hold space for',
    ],
    caricatureToAvoid:
      "Manosphere 'Broicism' / hustle-stoicism stripped of cosmopolitanism and ethics; Andrew Tate aesthetics; using the dichotomy of control as a license to ignore other people.",
  },

  seneca: {
    slug: 'seneca',
    name: 'Seneca',
    tradition: 'stoic',
    cognitiveMove:
      "Audit the reader's time and judgments as if writing a letter to a friend; expose the hidden cost of a worry by naming what it is actually buying; rehearse the worst case (premeditatio malorum) until it stops bargaining; assign one corrective practice that can begin today.",
    register:
      'Epistolary, urbane, rhetorical with balanced clauses; quotable but never glib. Speaks as an older friend writing late at night, not as a self-help author. Names the vice plainly before naming the remedy.',
    endsOn:
      'A correction the reader can begin in the next hour: an account closed, an hour reclaimed, a letter written, a frivolous appetite refused.',
    neverEndsOn:
      'A reassurance, a generic blessing, or a soft permission to keep doing what is costing the reader their life.',
    forbiddenPhrases: [
      'self-care',
      "you've earned this",
      "you're allowed to",
      'trust the process',
      'gentle reminder',
    ],
    caricatureToAvoid:
      "Seneca as Roman life-hacker quotable for LinkedIn; the hypocrisy reading that uses his wealth to dismiss the work; 'memento mori as merch'.",
  },

  epictetus: {
    slug: 'epictetus',
    name: 'Epictetus',
    tradition: 'stoic',
    cognitiveMove:
      'Apply the dichotomy of control as a blade: this (judgment, intention, attention, response) is yours, that (other people, outcomes, weather, the past) is not; refuse to grieve the not-yours; train the yours by deliberate practice on small things first.',
    register:
      'Spoken, classroom-direct, second-person, often catechistic. Short questions and shorter answers. The voice of an ex-slave who has nothing to lose by telling you the truth.',
    endsOn:
      'A drill. A specific, repeatable exercise the reader can run on the next provocation: the next slight, the next delay, the next craving.',
    neverEndsOn:
      'A philosophical conclusion or a feeling of having understood. Understanding is not the goal; training is.',
    forbiddenPhrases: [
      'you deserve',
      'manifest',
      'the universe',
      'hold space for',
      "you're allowed to",
    ],
    caricatureToAvoid:
      "Stoicism-as-stoicism: emotional suppression sold as virtue; the gym-bro 'control your mindset' reduction that drops the ethical core and the equality of all rational beings.",
  },

  aristotle: {
    slug: 'aristotle',
    name: 'Aristotle',
    tradition: 'aristotelian',
    cognitiveMove:
      'Identify what this particular situation, with these particular people and this particular history, calls for given the goal of eudaimonia; weigh competing virtues against each other; let phronesis (practical wisdom) perceive the right action — which is rarely the moderate one and never the formulaic one.',
    register:
      'Patient, taxonomic, qualifying. Builds clauses. Speaks in distinctions, not maxims. The voice of a careful teacher who refuses to flatten the case to make the answer easier.',
    endsOn:
      'A right action chosen for this person in this circumstance, framed as what the kind of person the reader is becoming would do today.',
    neverEndsOn:
      'A maxim, a slogan, a productivity tip, or "be moderate." If the reading reduces to "find the middle," it is not Aristotelian.',
    forbiddenPhrases: [
      'be moderate',
      'everything in moderation',
      'atomic habit',
      "you're allowed to",
      'small wins',
    ],
    caricatureToAvoid:
      'Aristotle as fortune-cookie or as Atomic-Habits productivity coach. Habit is one Aristotelian theme; eudaimonia is the goal, not throughput. The mean is not moderation.',
  },

  plato: {
    slug: 'plato',
    name: 'Plato',
    tradition: 'platonic',
    cognitiveMove:
      "Begin in the messy particular; ascend by analogy or image (cave, divided line, chariot, ladder of love) toward what is more lasting and more real beneath the situation; let the ascent itself reframe what the reader thought they were dealing with.",
    register:
      'Dialogic, image-driven, mythic when needed. Builds a scene, then turns it inward. Uses myth and metaphor as cognitive instruments, not decoration.',
    endsOn:
      'A reorientation: the reader sees the same situation from a higher vantage and the question they came in with has changed shape.',
    neverEndsOn:
      'A literal action item or a tidy moral. Plato closes by lifting the gaze, not by issuing a checklist.',
    forbiddenPhrases: [
      'manifest',
      'higher self',
      'raise your vibration',
      'visualize and receive',
      "you're allowed to",
    ],
    caricatureToAvoid:
      "'Look up at the Forms' as manifestation; Platonism reduced to law-of-attraction; the cave allegory used as a generic 'wake up sheeple' meme.",
  },

  pema_chodron: {
    slug: 'pema_chodron',
    name: 'Pema Chödrön',
    tradition: 'buddhist',
    cognitiveMove:
      'Locate where the difficulty lives in the body — the held breath, the tight jaw, the small flinch; stay with that exact sensation one breath longer than the reader wants to; practice tonglen (breathe in the suffering, breathe out relief) and universalize it to everyone else feeling the same thing right now.',
    register:
      'Tender but specific; bodily and concrete; never euphemistic, never saccharine. Names sensation precisely. The voice of someone who has actually sat with the difficulty rather than narrated about sitting with it.',
    endsOn:
      'Universalized compassion: the reader connected to countless others feeling the same flinch right now, having breathed once on their behalf.',
    neverEndsOn:
      'A task, a fix, a strategy, or soothing-as-evasion. The point is to stay, not to escape into action.',
    forbiddenPhrases: [
      'trust the process',
      'hold space for',
      'the universe is',
      "you're allowed to",
      'honor the pause',
    ],
    caricatureToAvoid:
      'McMindfulness — Buddhism reduced to a stress-relief app; spiritual-bypass softness that uses staying as a way to avoid action where action is required; Instagram tonglen as self-soothing.',
  },

  thich_nhat_hanh: {
    slug: 'thich_nhat_hanh',
    name: 'Thich Nhat Hanh',
    tradition: 'buddhist',
    cognitiveMove:
      'Return the reader to direct contact with one present object — the breath, the tea, the footstep, the hand on the doorknob — and stay there without goal; mindfulness is not for anything, it is the thing; the agitated mind dissolves not by being fought but by being met fully where it already is.',
    register:
      'Quiet, clear, almost childlike in its simplicity; short declarative sentences; present-tense; nothing wasted. The voice of a monk who has said this thousands of times and still means it.',
    endsOn:
      'Direct contact: the reader inside one ordinary present moment, fully met. A breath taken on purpose; a step felt.',
    neverEndsOn:
      'A teaching about mindfulness, a productivity outcome, or a clever paradox. The mind explaining mindfulness is not mindfulness.',
    forbiddenPhrases: [
      'be present (as instruction)',
      'mindset',
      'optimize',
      'the universe is',
      'hold space for',
    ],
    caricatureToAvoid:
      'Mindfulness as productivity hack; "just breathe" as glib dismissal; the corporate-wellness reduction that strips engaged Buddhism, the sangha, and the ethical core.',
  },

  lao_tzu: {
    slug: 'lao_tzu',
    name: 'Lao Tzu',
    tradition: 'taoist',
    cognitiveMove:
      "Reverse the reader's frame: what they are forcing is producing the resistance; show by paradox or natural image (water, the uncarved block, the empty vessel, the bent tree that survives) that the soft outlasts the hard and that wu wei is precisely-timed non-forcing, not passivity.",
    register:
      'Image-first, inverted, gnomic; balanced opposites in short lines; the rhythm of the Tao Te Ching. Says less than seems necessary and trusts the reader to feel the rest.',
    endsOn:
      'Stillness, or an image that loosens the grip. The cup sits; the tea steeps itself.',
    neverEndsOn:
      'A task, a plan, an action item, or a moral. To prescribe a doing is to miss the move.',
    forbiddenPhrases: [
      'go with the flow',
      'the universe wants',
      'manifest',
      'trust the process',
      'flow state',
    ],
    caricatureToAvoid:
      "Airport-bookstore 'go with the flow' Taoism; pop-Zen drained of the difficulty of doing wu wei; passive-permission Taoism used to justify avoidance.",
  },

  confucius: {
    slug: 'confucius',
    name: 'Confucius',
    tradition: 'confucian',
    cognitiveMove:
      "Locate the self inside its web of relationships — friend, child, parent, partner, colleague, citizen — and ask what li (ritual propriety in this specific relationship) calls for today; the small attention given freely in role outweighs the large one demanded; ethical demands fall on superiors first.",
    register:
      'Restrained, relational, formal without stiffness; short sayings with the cadence of the Analects. Addresses character, not feelings; assumes the reader is responsible for the texture of their relationships.',
    endsOn:
      'A small ritual act inside a specific relationship: tea poured, a name used, a birthday acknowledged, a letter sent before the easier one is opened.',
    neverEndsOn:
      'A self-focused affirmation or a generic kindness. Confucius does not address the isolated self; he addresses the self-in-role.',
    forbiddenPhrases: [
      'self-care',
      'put yourself first',
      'your truth',
      'authentic self',
      'set boundaries (as slogan)',
    ],
    caricatureToAvoid:
      "Hierarchy-justifying 'respect your elders' as silencing; Confucianism as obedience training. Real Confucianism makes the heaviest ethical demands on those with the most power.",
  },

  krishnamurti: {
    slug: 'krishnamurti',
    name: 'Jiddu Krishnamurti',
    tradition: 'krishnamurti',
    cognitiveMove:
      'Refuse the question as posed; show that the observer is the observed, that the one seeking the answer is itself the problem; offer no method, no system, no practice; let the seeing of the contradiction be the only act.',
    register:
      "Spoken, slow, recursive, unsparing. Asks more than tells. Repeats a question with a slight turn until the reader notices the assumption hidden inside it. No comfort, no mantra, no technique.",
    endsOn:
      'A direct question that closes no door and opens no method. The reader is left looking at their own looking.',
    neverEndsOn:
      'A practice, a technique, an instruction, a meditation, or anything the reader can "do" tomorrow. A Krishnamurti reading that gives a method is fake.',
    forbiddenPhrases: [
      'try this practice',
      'meditate on',
      'visualize',
      'affirm',
      'every day, do',
    ],
    caricatureToAvoid:
      'Krishnamurti as gentle guru with a gentle technique; "choiceless awareness" as a brand of meditation; any reading that ends in a method has made him into what he spent sixty years refusing to be.',
  },

  naval_ravikant: {
    slug: 'naval_ravikant',
    name: 'Naval Ravikant',
    tradition: 'modern_operator',
    cognitiveMove:
      "Identify which of the four — specific knowledge, leverage, judgment, or long horizon — the reader is short on right now; recommend the boring move that compounds; eliminate the low-leverage activity that is consuming the high-leverage one; play long-term games with long-term people.",
    register:
      'Tweet-shaped, declarative, unsentimental, calm. Short lines that survive on their own. The voice of someone who has stopped trying to convince anyone.',
    endsOn:
      'The high-leverage action the reader is avoiding, named without softening: ship the thing, close the app, write the code, send the one-line message.',
    neverEndsOn:
      'A motivational flourish, a quote of his own, or a hustle exhortation. Naval is monastic, not manic.',
    forbiddenPhrases: [
      'grind',
      'crush it',
      'hustle',
      '10x your',
      'trust the process',
    ],
    caricatureToAvoid:
      'Twitter-bro / crypto-bro Naval as productivity-hack of the day; the LinkedIn version that strips the long-horizon, almost-monastic frame and leaves only the leverage memes.',
  },

  eckhart_tolle: {
    slug: 'eckhart_tolle',
    name: 'Eckhart Tolle',
    tradition: 'advaitic',
    cognitiveMove:
      'Distinguish, in the reader\'s present moment, the content of thought from the awareness in which thought arises; ask "who is aware of the worry?"; rest, briefly, in that awareness rather than its content; let the situation be seen from the wider field rather than addressed from inside the story.',
    register:
      'Slow, even, unhurried; simple sentences; gently insistent. Repeats the pointing without escalating. Speaks as if there were no urgency, because the move is precisely to step out of the urgency.',
    endsOn:
      'The reader resting, even for one breath, as the awareness behind the thought rather than as the thinker of the thought.',
    neverEndsOn:
      'A method, a checklist, an action, or a metaphysical claim about the universe doing something. The point is recognition, not doing.',
    forbiddenPhrases: [
      'manifest',
      'raise your vibration',
      'the universe wants',
      'high vibe',
      'attract abundance',
    ],
    caricatureToAvoid:
      'Spiritual bypassing — using "presence" to skip over material problems, injustice, or grief; New-Thought Tolle that imports "the universe conspires" cosmology he does not actually teach.',
  },

  camus: {
    slug: 'camus',
    name: 'Albert Camus',
    tradition: 'existentialist',
    cognitiveMove:
      "Confront the absurd directly: the situation does not mean anything, and that is the difficult and the freeing part; refuse the leap into faith and the leap into despair; revolt by continuing to live, work, and love lucidly without the consolation of a meaning that was not earned. Imagine Sisyphus happy without pretending the stone is light.",
    register:
      "Lucid, clean, unsentimental, French-classical. No mysticism, no comfort, no flourish. The prose of someone who has weighed suicide and chosen the morning anyway.",
    endsOn:
      'Lucid revolt: the reader, with no meaning supplied, doing the next honest thing — pushing the stone, writing the sentence, making the call — because that is the only move available to a free person.',
    neverEndsOn:
      "Comfort, reassurance, an 'invincible summer' as warm blanket, or any 'make your own meaning' motivational poster. Camus refuses the consolation he is so often quoted to provide.",
    forbiddenPhrases: [
      'everything happens for a reason',
      'make your own meaning',
      'the universe',
      'trust the process',
      "you're exactly where you need to be",
    ],
    caricatureToAvoid:
      "Motivational-poster Camus: 'in the depth of winter I found within me an invincible summer' weaponized as Instagram comfort. The invincible summer is defiance, not warmth.",
  },

  viktor_frankl: {
    slug: 'viktor_frankl',
    name: 'Viktor Frankl',
    tradition: 'existentialist',
    cognitiveMove:
      'Reverse the question. Stop asking what the reader wants from life and ask what this exact moment, with its constraints, is asking of them; meaning is not chosen in the abstract, it is found in the response to a specific situation that cannot be changed; even when circumstances cannot move, the stance toward them can.',
    register:
      "Clinical, gentle, witnessed-from-inside-suffering. The voice of a psychiatrist who saw the camps and refuses to use the word lightly. Names freedom and responsibility in the same breath, never one without the other.",
    endsOn:
      "The specific response this situation is asking of the reader today: the visit made, the work continued, the dignity preserved when nothing else can be.",
    neverEndsOn:
      "'Find your why' as career advice; a productivity prompt; a generic uplift. Using Auschwitz-forged meaning to sell ambition is grotesque.",
    forbiddenPhrases: [
      'find your why',
      'live your best life',
      'crush your goals',
      'dream big',
      'manifest your purpose',
    ],
    caricatureToAvoid:
      "TED-talk Frankl reduced to 'find your why' for product launches; logotherapy as motivational technique stripped of the suffering it was forged to answer.",
  },

  mary_oliver: {
    slug: 'mary_oliver',
    name: 'Mary Oliver',
    tradition: 'poet_attentive',
    cognitiveMove:
      'Pay attention to one specific creature, plant, or object in front of the reader — a grasshopper, a goldfinch, the wet bark — be astonished by it on its own terms, and tell about it; attention as devotion; the instruction emerges from the looking, never imposed onto it.',
    register:
      "Plain, exact, sensory; specific to the point of strangeness. Names the actual thing — black ant, sycamore, the way light moves on water — and refuses abstraction. Short lines that feel walked, not written.",
    endsOn:
      'A gentle imperative emerging from what was observed: tell about it, go outside, look again. Earned by the specificity that preceded it, never substituting for it.',
    neverEndsOn:
      "A vague 'be present, be soft' sentiment; an Instagram-poetry pseudo-blessing; a 'gentle reminder' to a 'gentle one.' Oliver's softness is built on relentless specificity.",
    forbiddenPhrases: [
      'gentle one',
      'dear soul',
      'sweet soul',
      'honor the rest',
      'hold space for',
    ],
    caricatureToAvoid:
      "Watered-down Mary Oliver as Instagram-poetry register: short lines, soft sentiments, vague 'permission' language. Her actual move is specificity; without the named creature there is no Oliver.",
  },
};

export const PRIORITY_SLUGS = Object.keys(DEEP_BRIEFS) as readonly string[];

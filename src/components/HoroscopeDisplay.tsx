import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';

// Zodiac sign data with symbols, date ranges, and elements
const ZODIAC_SIGNS = [
  { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
  { sign: 'gemini', symbol: '♊', dateRange: 'May 21 - Jun 20', element: 'Air' },
  { sign: 'cancer', symbol: '♋', dateRange: 'Jun 21 - Jul 22', element: 'Water' },
  { sign: 'leo', symbol: '♌', dateRange: 'Jul 23 - Aug 22', element: 'Fire' },
  { sign: 'virgo', symbol: '♍', dateRange: 'Aug 23 - Sep 22', element: 'Earth' },
  { sign: 'libra', symbol: '♎', dateRange: 'Sep 23 - Oct 22', element: 'Air' },
  { sign: 'scorpio', symbol: '♏', dateRange: 'Oct 23 - Nov 21', element: 'Water' },
  { sign: 'sagittarius', symbol: '♐', dateRange: 'Nov 22 - Dec 21', element: 'Fire' },
  { sign: 'capricorn', symbol: '♑', dateRange: 'Dec 22 - Jan 19', element: 'Earth' },
  { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18', element: 'Air' },
  { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20', element: 'Water' },
];

export async function HoroscopeDisplay() {
  // Fetch horoscopes for all zodiac signs
  const horoscopes = await getHoroscopesForAllSigns();

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1/3 h-1/3 bg-blue-500/20 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7 relative z-10">
        {ZODIAC_SIGNS.map(({ sign, symbol, dateRange, element }) => (
          <ZodiacCard
            key={sign}
            sign={sign}
            symbol={symbol}
            dateRange={dateRange}
            element={element}
            horoscope={horoscopes[sign]}
          />
        ))}
      </div>
    </div>
  );
} 
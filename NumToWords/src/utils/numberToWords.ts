export type NumberingSystem = 'western' | 'indian';

export function numberToWords(
  input: number | string,
  options?: { system?: NumberingSystem; lang?: 'en' | 'hi' },
): string {
  const system = options?.system ?? 'western';
  const lang = options?.lang ?? 'en';
  if (input === null || input === undefined || input === '') return '';
  const str = String(input).trim();
  if (str === '') return '';

  // Handle negative
  let negative = false;
  let s = str;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }

  // Split integer and fractional
  const parts = s.split(/[.,]/);
  const intPart = parts[0].replace(/^0+(?!$)/, '');
  const fracPart = parts[1] ?? null;

  const ones =
    lang === 'hi'
      ? ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ']
      : [
          'zero',
          'one',
          'two',
          'three',
          'four',
          'five',
          'six',
          'seven',
          'eight',
          'nine',
        ];
  const teens =
    lang === 'hi'
      ? [
          'दस',
          'ग्यारह',
          'बारह',
          'तेरह',
          'चौदह',
          'पंद्रह',
          'सोलह',
          'सत्रह',
          'अठारह',
          'उन्नीस',
        ]
      : [
          'ten',
          'eleven',
          'twelve',
          'thirteen',
          'fourteen',
          'fifteen',
          'sixteen',
          'seventeen',
          'eighteen',
          'nineteen',
        ];
  const tens =
    lang === 'hi'
      ? [
          '',
          '',
          'बीस',
          'तीस',
          'चालीस',
          'पचास',
          'साठ',
          'सत्तर',
          'अस्सी',
          'नब्बे',
        ]
      : [
          '',
          '',
          'twenty',
          'thirty',
          'forty',
          'fifty',
          'sixty',
          'seventy',
          'eighty',
          'ninety',
        ];

  // Hindi irregular mapping for 0..99 (Devanagari). This helps produce correct two-digit words in Hindi.
  const hi0to99: string[] = [
    'शून्य',
    'एक',
    'दो',
    'तीन',
    'चार',
    'पाँच',
    'छह',
    'सात',
    'आठ',
    'नौ',
    'दस',
    'ग्यारह',
    'बारह',
    'तेरह',
    'चौदह',
    'पंद्रह',
    'सोलह',
    'सत्रह',
    'अठारह',
    'उन्नीस',
    'बीस',
    'इक्कीस',
    'बाईस',
    'तेईस',
    'चौबीस',
    'पच्चीस',
    'छब्बीस',
    'सत्ताईस',
    'अट्ठाईस',
    'उनतीस',
    'तीस',
    'इकतीस',
    'बत्तीस',
    'तैंतीस',
    'चौंतीस',
    'पैंतीस',
    'छत्तीस',
    'सैंतीस',
    'अड़तीस',
    'उनतालीस',
    'चालीस',
    'इकतालीस',
    'बयालीस',
    'तैंतालीस',
    'चवालीस',
    'पैंतालीस',
    'छियालीस',
    'सैंतालीस',
    'अड़तालीस',
    'उनचास',
    'पचास',
    'इक्यावन',
    'बावन',
    'तिरेपन',
    'चौवन',
    'पचपन',
    'छप्पन',
    'सत्तावन',
    'अठ्ठावन',
    'उनसठ',
    'साठ',
    'इकसठ',
    'बासठ',
    'तिरसठ',
    'चौंसठ',
    'पैंसठ',
    'छियासठ',
    'सड़सठ',
    'अड़सठ',
    'उनहत्तर',
    'सत्तर',
    'इकहत्तर',
    'बहत्तर',
    'तिहत्तर',
    'चौहत्तर',
    'पचहत्तर',
    'छिहत्तर',
    'सतहत्तर',
    'अठहत्तर',
    'उनासी',
    'अस्सी',
    'इक्यासी',
    'बयासी',
    'तिरासी',
    'चौरासी',
    'पचासी',
    'छियासी',
    'सतासी',
    'अठासी',
    'उन्यासी',
    'नब्बे',
    'इक्यानवे',
    'बानवे',
    'तिरेनवे',
    'चौरानवे',
    'पचानवे',
    'छियानवे',
    'सतानवे',
    'अट्ठानवे',
    'निन्यानवे',
  ];

  function threeDigitsToWords(numStr: string): string {
    let n = parseInt(numStr, 10);
    if (n === 0) return '';
    let words: string[] = [];
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    if (hundred > 0) {
      words.push(ones[hundred]);
      words.push(lang === 'hi' ? 'सौ' : 'hundred');
    }
    if (rem > 0) {
      if (lang === 'hi') {
        const remWords = twoDigitsToWords(String(rem));
        if (remWords) words.push(remWords);
      } else {
        if (rem >= 10 && rem < 20) {
          words.push(teens[rem - 10]);
        } else if (rem >= 20) {
          const t = Math.floor(rem / 10);
          const o = rem % 10;
          words.push(tens[t]);
          if (o > 0) words.push(ones[o]);
        } else if (rem > 0 && rem < 10) {
          words.push(ones[rem]);
        }
      }
    }
    return words.join(' ');
  }

  function twoDigitsToWords(numStr: string): string {
    const n = parseInt(numStr, 10);
    if (n === 0) return '';
    if (lang === 'hi' && n < hi0to99.length) return hi0to99[n];
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? ' ' + ones[o] : '');
  }

  function integerToWordsWestern(iStr: string): string {
    if (iStr === '' || iStr === '0') return 'zero';
    const scales =
      lang === 'hi'
        ? ['', 'हज़ार', 'मिलियन', 'बिलियन', 'ट्रिलियन', 'क्वाड्रिलियन']
        : ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion'];
    // pad left to multiple of 3
    const pad = (3 - (iStr.length % 3)) % 3;
    const padded = '0'.repeat(pad) + iStr;
    const groups: string[] = [];
    for (let i = 0; i < padded.length; i += 3) {
      groups.push(padded.substr(i, 3));
    }
    const partsWords: string[] = [];
    const groupCount = groups.length;
    for (let idx = 0; idx < groupCount; idx++) {
      const grp = groups[idx];
      const grpWords = threeDigitsToWords(grp);
      const scaleIdx = groupCount - idx - 1;
      if (grpWords) {
        const scale = scales[scaleIdx] || '';
        partsWords.push(grpWords + (scale ? ' ' + scale : ''));
      }
    }
    return partsWords.join(' ').replace(/\s+/g, ' ').trim();
  }

  function integerToWordsIndian(iStr: string): string {
    if (iStr === '' || iStr === '0') return 'zero';
    // Indian grouping: last 3 digits, then groups of 2
    const n = iStr;
    const len = n.length;
    const groups: string[] = [];
    // take last 3
    const last3 = n.slice(Math.max(0, len - 3));
    const left = n.slice(0, Math.max(0, len - 3));
    if (left.length > 0) {
      // split left into pairs from the right
      let i = left.length;
      while (i > 0) {
        const start = Math.max(0, i - 2);
        groups.unshift(left.slice(start, i));
        i -= 2;
      }
      groups.push(last3);
    } else {
      groups.push(last3);
    }

    const scalesIndian =
      lang === 'hi'
        ? ['', 'हज़ार', 'लाख', 'करोड़', 'अरब', 'खरब']
        : ['', 'thousand', 'lakh', 'crore', 'arab', 'kharab'];
    // groups now left-to-right, but we need to process from leftmost
    const partsWords: string[] = [];
    const groupCount = groups.length;
    for (let idx = 0; idx < groupCount; idx++) {
      const grp = groups[idx];
      // For the rightmost group (last), it can be 3 digits; others are 1-2 digits
      const isLast = idx === groupCount - 1;
      const grpWords = isLast
        ? threeDigitsToWords(grp.padStart(3, '0'))
        : twoDigitsToWords(grp);
      const scaleIdx = groupCount - idx - 1;
      if (grpWords) {
        const scale = scalesIndian[scaleIdx] || '';
        partsWords.push(grpWords + (scale ? ' ' + scale : ''));
      }
    }
    return partsWords.join(' ').replace(/\s+/g, ' ').trim();
  }

  function fractionalToWords(f: string): string {
    if (!f) return '';
    // Spell digits individually after "point"
    const digits = f
      .split('')
      .map(d => {
        if (/\d/.test(d)) return ones[parseInt(d, 10)];
        return '';
      })
      .filter(Boolean);
    if (digits.length === 0) return '';
    return lang === 'hi'
      ? 'दशमलव ' + digits.join(' ')
      : 'point ' + digits.join(' ');
  }

  const intWords =
    system === 'indian'
      ? integerToWordsIndian(intPart === '' ? '0' : intPart)
      : integerToWordsWestern(intPart === '' ? '0' : intPart);
  const fracWords = fractionalToWords(fracPart || '');
  const sign = negative ? 'minus ' : '';
  const signWord = negative ? (lang === 'hi' ? 'माइनस ' : 'minus ') : '';
  return (signWord + intWords + (fracWords ? ' ' + fracWords : '')).trim();
}

export default numberToWords;

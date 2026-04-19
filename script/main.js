let dictionary = [];
let dicoLoaded = false;

async function loadDico() {
    const statusEl = document.getElementById('dico-status');
    const loaded = [];
    const failed = [];

    try {
        const res1 = await fetch('./ressources/dico_fr.txt');
        if (res1.ok) {
            const text1 = await res1.text();
            const lines1 = text1.split('\n');
            for (let i = 0; i < lines1.length; i++) {
                const word = lines1[i].trim().toLowerCase();
                if (word !== '') {
                    dictionary.push(word);
                }
            }
            loaded.push('dico_fr.txt (' + dictionary.length.toLocaleString() + ' words)');
        } else {
            failed.push('dico_fr.txt');
        }
    } catch (e) {
        failed.push('dico_fr.txt');
    }

    try {
        const res2 = await fetch('./ressources/dico_eng.txt');
        if (res2.ok) {
            const text2 = await res2.text();
            const lines2 = text2.split('\n');
            for (let i = 0; i < lines2.length; i++) {
                const word = lines2[i].trim().toLowerCase();
                if (word !== '') {
                    dictionary.push(word);
                }
            }
            loaded.push('dico_eng.txt (' + dictionary.length.toLocaleString() + ' words)');
        } else {
            failed.push('dico_eng.txt');
        }
    } catch (e) {
        failed.push('dico_eng.txt');
    }

    if (loaded.length > 0) {
        dicoLoaded = true;
        let failedMsg = '';
        if (failed.length > 0) {
            failedMsg = ' — <span style="color:#ba7517">' + failed.join(', ') + ' unavailable</span>';
        }
        const loadedText = loaded.join(' + ');
        statusEl.innerHTML = '<span class="dot dot-ok"></span> ' + loadedText + '<strong>' + dictionary.length.toLocaleString() + '</strong> words in total' + failedMsg;
    }
}

function analyze() {
    const inputElement = document.getElementById('input');
    const text = inputElement.value;
    const resultsDiv = document.getElementById('results');

    if (text.trim() === '') {
        resultsDiv.style.display = 'none';
        return;
    }

    resultsDiv.style.display = 'block';

    const chars = text.length;

    let spaces = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
            spaces++;
        }
    }

    let sentences = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
            sentences++;
        }
    }

    const rawTokens = [];
    let currentWord = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') ||
            (char >= 'À' && char <= 'ÿ') || char === '-' || char === "'";

        if (isLetter) {
            currentWord += char;
        } else {
            if (currentWord !== '') {
                rawTokens.push(currentWord);
                currentWord = '';
            }
        }
    }
    if (currentWord !== '') {
        rawTokens.push(currentWord);
    }

    const words = [];
    for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];
        if (token.length > 1) {
            words.push(token);
        } else if (token.length === 1) {
            const vowels = 'aeiouyàâéèêëîïôùûüÿAEIOUYÀÂÉÈÊËÎÏÔÙÛÜŸ';
            let isVowel = false;
            for (let j = 0; j < vowels.length; j++) {
                if (token === vowels[j]) {
                    isVowel = true;
                    break;
                }
            }
            if (isVowel) {
                words.push(token);
            }
        }
    }

    document.getElementById('s-words').textContent = words.length;
    document.getElementById('s-chars').textContent = chars;
    document.getElementById('s-spaces').textContent = spaces;
    document.getElementById('s-sentences').textContent = sentences;

    const freq = {};
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        let cleanWord = word.toLowerCase();

        while (cleanWord[0] === "'") {
            cleanWord = cleanWord.substring(1);
        }
        while (cleanWord[cleanWord.length - 1] === "'") {
            cleanWord = cleanWord.substring(0, cleanWord.length - 1);
        }

        if (cleanWord.length >= 2) {
            if (freq[cleanWord] === undefined) {
                freq[cleanWord] = 0;
            }
            freq[cleanWord] = freq[cleanWord] + 1;
        }
    }

    const freqArray = [];
    for (const key in freq) {
        freqArray.push([key, freq[key]]);
    }

    for (let i = 0; i < freqArray.length; i++) {
        for (let j = i + 1; j < freqArray.length; j++) {
            if (freqArray[i][1] < freqArray[j][1]) {
                const temp = freqArray[i];
                freqArray[i] = freqArray[j];
                freqArray[j] = temp;
            }
        }
    }

    const top5 = [];
    for (let i = 0; i < 5 && i < freqArray.length; i++) {
        top5.push(freqArray[i]);
    }

    let maxFreq = 1;
    if (top5.length > 0) {
        maxFreq = top5[0][1];
    }

    const topWordsEl = document.getElementById('top-words');
    topWordsEl.innerHTML = '';

    if (top5.length === 0) {
        topWordsEl.innerHTML = '<span style="color:#b4b2a9;font-size:0.85rem">Not enough words</span>';
    } else {
        for (let i = 0; i < top5.length; i++) {
            const word = top5[i][0];
            const count = top5[i][1];
            const percent = Math.round((count / maxFreq) * 100);

            const html = '<div class="word-bar-row">' +
                '<span class="word-label">' + word + '</span>' +
                '<div class="bar-track"><div class="bar-fill" style="width:' + percent + '%"></div></div>' +
                '<span class="word-count">' + count + '</span>' +
                '</div>';

            topWordsEl.innerHTML += html;
        }
    }

    const sentencesList = [];
    let sentenceStart = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
            const sentence = text.substring(sentenceStart, i + 1).trim();
            sentencesList.push(sentence);
            sentenceStart = i + 1;
        }
    }
    const lastPart = text.substring(sentenceStart).trim();
    if (lastPart !== '') {
        sentencesList.push(lastPart);
    }

    const sentenceStartWords = [];
    for (let i = 0; i < sentencesList.length; i++) {
        const sentence = sentencesList[i];
        let firstWord = '';
        for (let j = 0; j < sentence.length; j++) {
            const char = sentence[j];
            const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') ||
                (char >= 'À' && char <= 'ÿ') || char === '-' || char === "'";
            if (isLetter) {
                firstWord += char;
            } else if (firstWord !== '') {
                break;
            }
        }
        if (firstWord !== '') {
            sentenceStartWords.push(firstWord);
        }
    }

    const properCandidates = [];
    for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];
        if (token.length > 1) {
            const firstChar = token[0];
            const isUpperCase = (firstChar >= 'A' && firstChar <= 'Z') || (firstChar >= 'À' && firstChar <= 'Ÿ');

            if (isUpperCase) {
                let isStartWord = false;
                for (let j = 0; j < sentenceStartWords.length; j++) {
                    if (sentenceStartWords[j] === token && i === 0) {
                        isStartWord = true;
                        break;
                    }
                }

                if (!isStartWord) {
                    let alreadyAdded = false;
                    for (let j = 0; j < properCandidates.length; j++) {
                        if (properCandidates[j] === token) {
                            alreadyAdded = true;
                            break;
                        }
                    }
                    if (!alreadyAdded) {
                        properCandidates.push(token);
                    }
                }
            }
        }
    }

    const filtered = [];
    for (let i = 0; i < properCandidates.length; i++) {
        const candidate = properCandidates[i];
        const lower = candidate.toLowerCase();
        let found = false;

        for (let j = 0; j < dictionary.length; j++) {
            if (dictionary[j] === lower) {
                found = true;
                break;
            }
        }

        if (!found) {
            filtered.push(candidate);
        }
    }

    const properEl = document.getElementById('proper-nouns');
    properEl.innerHTML = '';

    if (filtered.length === 0) {
        properEl.innerHTML = '<span style="color:#b4b2a9;font-size:0.85rem">No candidates detected</span>';
    } else {
        for (let i = 0; i < filtered.length; i++) {
            const word = filtered[i];
            properEl.innerHTML += '<span class="tag tag-proper">' + word + '</span>';
        }
    }

    const unknownEl = document.getElementById('unknown-words');
    unknownEl.innerHTML = '';

    if (!dicoLoaded) {
        unknownEl.innerHTML = '<span style="color:#b4b2a9;font-size:0.85rem">Dictionary not loaded</span>';
        return;
    }

    const unknownWords = [];
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        let cleanWord = word.toLowerCase();

        while (cleanWord[0] === "'") {
            cleanWord = cleanWord.substring(1);
        }
        while (cleanWord[cleanWord.length - 1] === "'") {
            cleanWord = cleanWord.substring(0, cleanWord.length - 1);
        }

        if (cleanWord.length >= 2) {
            let found = false;
            for (let j = 0; j < dictionary.length; j++) {
                if (dictionary[j] === cleanWord) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                let alreadyAdded = false;
                for (let j = 0; j < unknownWords.length; j++) {
                    if (unknownWords[j] === cleanWord) {
                        alreadyAdded = true;
                        break;
                    }
                }
                if (!alreadyAdded) {
                    unknownWords.push(cleanWord);
                }
            }
        }
    }

    for (let i = 0; i < unknownWords.length; i++) {
        for (let j = i + 1; j < unknownWords.length; j++) {
            if (unknownWords[i] > unknownWords[j]) {
                const temp = unknownWords[i];
                unknownWords[i] = unknownWords[j];
                unknownWords[j] = temp;
            }
        }
    }

    if (unknownWords.length === 0) {
        unknownEl.innerHTML = '<span style="color:#639922;font-size:0.85rem">All words are in the dictionary</span>';
    } else {
        for (let i = 0; i < unknownWords.length; i++) {
            const word = unknownWords[i];
            unknownEl.innerHTML += '<span class="tag tag-unknown">' + word + '</span>';
        }
    }
}

const inputElement = document.getElementById('input');
inputElement.addEventListener('input', function () {
    analyze();
});

const pasteButton = document.getElementById('btn-paste');
pasteButton.addEventListener('click', function () {
    navigator.clipboard.readText().then(function (clipboardText) {
        inputElement.value = clipboardText;
        analyze();
    }).catch(function (error) {
        console.error('Erreur lors du collage:', error);
    });
});

const clearButton = document.getElementById('btn-clear');
clearButton.addEventListener('click', function () {
    inputElement.value = '';
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'none';
});

loadDico();

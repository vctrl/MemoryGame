const rowsCount = 4;
const columnsCount = 3;
const time = { m: 0, s: 1 };

let emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁',
    '🐮', '🐷', '🐸', '🐙', '🐵', '🦄', '🐞', '🦀', '🐟',
    '🐊', '🐓', '🦃', '🐿', '🐬', '🐳', '🐋', '🐏', '🐑', '🐡'];

function initGame() {
    const shuffledEmojis = shuffleEmojis();
    const cards = shuffledEmojis.map(e => new Card(e));
    const timer = new Timer(time);
    const menu = new Menu();
    const game = new Game(cards, timer, menu);
    const playAgainBtn = document.querySelector('.play-again-button');
    playAgainBtn.addEventListener('click', () => game.restart())
}

class Game {
    constructor(cards, timer, menu) {
        this.cards = cards;
        this.timer = timer;
        this.openedCards = [];
        this.createGrid();
        this.menu = menu;
    }

    end(resultText, buttonText) {
        this.timer.clear();
        this.menu.show(buttonText, resultText);
    }

    restart() {
        let getNext = function (arr) {
            let counter = 0;
            return function () {
                let next = arr[counter]; counter += 1; return next;
            }
        };
        let shuffledEmojis = shuffleEmojis()
        let nextEmoji = getNext(shuffledEmojis);
        this.cards.forEach(c => {
            c.clear(true);
            setTimeout(function () {
                c.textContent = nextEmoji();
                c.element.style.transition = 'transform .5s';
            }, 200);
        });

        this.openedCards = [];
        this.menu.hide();
        this.timer = new Timer(time);
        this.timer.start(this);
    }

    createGrid() {
        let grid = document.getElementById('card-grid');
        grid.style.gridTemplateColumns = 'repeat(' + (rowsCount - 1) + ', 130px 25px) 130px';
        grid.style.gridTemplateRows = 'repeat(' + (columnsCount - 1) + ', 130px 25px) 130px';

        for (var i = 1; i <= columnsCount * 2; i += 2) {
            let gridRowStart = i;
            let gridRowEnd = i + 1;
            for (var j = 1; j <= rowsCount * 2; j += 2) {
                let gridColumnStart = j;
                let gridColumnEnd = j + 1;
                let card = this.cards[(i - 1) / 2 * rowsCount + (j - 1) / 2];
                card.setGridArea(gridRowStart, gridColumnStart, gridRowEnd, gridColumnEnd);
                grid.appendChild(card.element);
            }
        }

        grid.addEventListener('click', (event) => this.AddEventListeners(event, this.timer, this), true);
        return grid;
    }

    AddEventListeners(event, timer, game) {
        let target = event.target;
        let parent = target.parentElement;

        if (target.classList.contains('card-grid') || target.classList.contains('card') || parent.classList.contains('freezed')) {
            return;
        }

        if (target.classList.contains('card-front') && !timer.isStarted) {
            timer.start(game);
            timer.isStarted = true;
        }

        let card = new Card(null, parent);

        if (card.isOpened()) {
            card.close();
        }
        else {
            card.open();
            let openedCards = this.openedCards;
            switch (openedCards.length) {
                case 0:
                    openedCards.push(card);
                    break;
                case 1:
                    if (card.matches(openedCards[0])) {
                        openedCards[0].match();
                        card.match();
                        this.openedCards = [];
                        if (Array.from(document.getElementsByClassName('open-card')).length == rowsCount * columnsCount) {
                            game.end('Win', 'Play again');
                        }
                    }
                    else {
                        openedCards[0].mismatch();
                        card.mismatch();
                        openedCards.push(card);
                    }
                    break;
                case 2:
                    openedCards.forEach(c => {
                        c.clear();
                        c.close();
                    })

                    this.openedCards = [card];
                    break;
            }
        }
    }
}

class Card {
    constructor(content, element) {
        if (content) {
            let card = document.createElement('div');
            card.classList.add('card');
            let cardFront = document.createElement('div');
            cardFront.classList.add('card-front');
            card.appendChild(cardFront);
            this.cardFront = cardFront;

            let cardBack = document.createElement('div');
            cardBack.classList.add('card-back');
            card.appendChild(cardBack);
            cardBack.textContent = content;
            this.cardBack = cardBack;

            this.element = card;
        }
        else {
            this.element = element;
            this.cardBack = element.querySelector('.card-back');
            this.cardFront = element.querySelector('.card-front');
        }
    }

    open() {
        this.element.classList.add('open-card');
        this.element.classList.remove('close-card');
        this.element.classList.add('freezed');
    }

    close(quick) {
        this.element.classList.remove('open-card');
        this.element.classList.add('close-card');
        if (quick)
            this.element.style.transition = 'transform .2s';
    }

    isOpened() {
        return this.element.classList.contains('open-card')
    }

    freeze() {
        this.element.classList.add('freezed');
    }

    matches(otherCard) {
        return this.element.textContent == otherCard.element.textContent;
    }

    match() {
        this.cardBack.classList.add('match');
    }

    mismatch() {
        this.cardBack.classList.add('mismatch');
    }

    setGridArea(gridRowStart, gridColumnStart, gridRowEnd, gridColumnEnd) {
        this.element.style.gridArea = gridRowStart + ' / ' + gridColumnStart + ' / ' + gridRowEnd + ' / ' + gridColumnEnd;
    }

    clear(quick = false) {
        this.cardBack.classList.remove('match');
        this.cardBack.classList.remove('mismatch');
        this.element.classList.remove('freezed');
        this.close(quick);
    }

    set textContent(content) {
        this.cardBack.textContent = content;
    }
}

class Timer {
    constructor(initialTime) {
        this.timeInternal = initialTime;
        this.timer = document.querySelector('.timer');
        this.timer.textContent = formatTime(initialTime);
        this._isStarted = false;
    }

    start(game) {
        let getNextTimerValue1 = getNextTimerValue(this.timeInternal);
        let timerId = setInterval(() => {
            let nextTime = getNextTimerValue1();
            this.timer.textContent = formatTime(nextTime);
            if (nextTime.m == 0 && nextTime.s == 0) {
                let endGame = game.end.bind(game)
                endGame('Loose', 'Try again')
            };
        }, 1000);

        this.timerId = timerId;
        this._isStarted = true;
    }

    clear() {
        clearInterval(this.timerId)
    }

    get isStarted() {
        return this._isStarted;
    }

    set isStarted(isStarted) {
        this._isStarted = isStarted;
    }
}

class Menu {
    constructor() {
        this.fullscreen = document.querySelector('.fullscreen');
        this.playAgainText = document.querySelector('.play-again-text')
        this.notificationText = document.querySelector('.notification-text');
    }

    show(buttonText, resultText) {
        this.fullscreen.style.display = 'flex';
        this.playAgainText.textContent = buttonText;
        splitTextToTags(this.notificationText, resultText)
    }

    hide() {
        this.fullscreen.style.display = 'none';
    }
}

function getNextTimerValue(t) {
    let t1 = { s: t.s, m: t.m };
    return function () {
        t1 = (t1.s > 0) ? { m: t1.m, s: t1.s - 1 } : { m: t1.m - 1, s: 59 };
        return t1;
    };
}

function formatTime(t) {
    return leadingZero(t.m) + ':' + leadingZero(t.s);
}

function leadingZero(num) {
    return (num >= 10 ? '' : '0') + num.toString();
}

function shuffleEmojis() {
    let uniqueCount = rowsCount * columnsCount / 2
    let shuffled = shuffleLastN(emojis, uniqueCount).slice(emojis.length - uniqueCount);
    let shuffled2 = shuffled.concat(shuffled);
    return shuffleLastN(shuffled2, shuffled2.length);
}

function shuffleLastN(a, n) {
    var j, x, i;
    for (i = a.length - 1; i > a.length - n; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }

    return a;
}

function splitTextToTags(notificationText, str) {
    Array.from(notificationText.getElementsByTagName('p')).forEach(p => notificationText.removeChild(p));
    for (var i = 0; i < str.length; i++) {
        let char = document.createElement('p');
        char.textContent = str.charAt(i);
        char.animate([
            { transform: 'rotate3d(1, 0, 0, 0deg)' },
            { transform: 'rotate3d(1, 0, 0, 70deg)' },
            { transform: 'rotate3d(1, 0, 0, 0deg)' }

        ], {
            duration: 1200,
            iterations: Infinity,
            easing: 'ease-out',
            delay: i * 100,
        });

        notificationText.appendChild(char);
    }
}
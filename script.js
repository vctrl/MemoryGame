let cellsWidth = 4;
let cellsHeight = 3;
let time = { m: 1, s: 0 };

let emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁',
    '🐮', '🐷', '🐸', '🐙', '🐵', '🦄', '🐞', '🦀', '🐟',
    '🐊', '🐓', '🦃', '🐿', '🐬', '🐳', '🐋', '🐏', '🐑', '🐡'];

    // remove this
let timerId;
let openedCards = [];

function initGame() {
    let shuffled = shuffle(emojis).slice(0, cellsWidth * cellsHeight / 2);
    let shuffled2 = shuffled.concat(shuffled);
    let shuffledEmojis = shuffle(shuffled2);
    let cards = [...Array(cellsWidth * cellsHeight).keys()].map(i => new Card(shuffledEmojis[i]));

    let timer = new Timer(time);
    let game = new Game(cards, timer);
    game.createGrid();
    let playAgainBtn = document.querySelector('.play-again-button');
    playAgainBtn.addEventListener('click', (event) => game.restart())
}

class Game {
    constructor(cards, timer) {
        this.cards = cards;
        this.timer = timer;
        this.openedCards = [];
        this.createGrid();
    }

    end(timerId, resultText, buttonText) {
        clearInterval(timerId);
        document.querySelector('.fullscreen').style.display = 'flex';
        document.querySelector('.notification').style.display = 'flex';
        splitTextToTags(resultText);
        document.querySelector('.play-again-text').textContent = buttonText;
    }

    restart() {
        let shuffled = shuffle(emojis).slice(0, cellsWidth * cellsHeight / 2);
        let shuffled2 = shuffled.concat(shuffled);
        let shuffledEmojis = shuffle(shuffled2);

        let getNext = function (arr) {
            let counter = 0;
            return function () {
                let next = arr[counter]; counter += 1; return next;
            }
        };

        let nextEmoji = getNext(shuffledEmojis);
        this.cards.forEach(c => {
            c.clear(true);
            setTimeout(function () {
                c.textContent = nextEmoji();
                c.element.style.transition = 'transform .5s';
            }, 200);
        });

        openedCards = [];
        document.querySelector('.fullscreen').style.display = 'none';
        timerId = this.timer.start(this.end);
    }

    createGrid() {
        let grid = document.getElementById('card-grid');
        grid.style.gridTemplateColumns = 'repeat(' + (cellsWidth - 1) + ', 130px 25px) 130px';
        grid.style.gridTemplateRows = 'repeat(' + (cellsHeight - 1) + ', 130px 25px) 130px';

        for (var i = 1; i <= cellsHeight * 2; i += 2) {
            let gridRowStart = i;
            let gridRowEnd = i + 1;
            for (var j = 1; j <= cellsWidth * 2; j += 2) {
                let gridColumnStart = j;
                let gridColumnEnd = j + 1;
                let card = this.cards[(i - 1) / 2 * cellsWidth + (j - 1) / 2];
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
            timerId = timer.start(game.end);
            timer.isStarted = true;
        }

        let card = new Card(null, parent);

        if (card.isOpened()) {
            card.close();
        }
        else {
            card.open();
            switch (openedCards.length) {
                case 0:
                    openedCards.push(card);
                    break;
                case 1:
                    if (card.matches(openedCards[0])) {
                        openedCards[0].match();
                        card.match();
                        openedCards = [];
                        if (Array.from(document.getElementsByClassName('open-card')).length == cellsWidth * cellsHeight) {
                            game.end(timerId, 'Win', 'Play again');
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

                    openedCards = [card];
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

    start(endGame) {
        let getNextTimerValue1 = getNextTimerValue(this.timeInternal);
        let timerId = setInterval(() => {
            let nextTime = getNextTimerValue1();
            this.timer.textContent = formatTime(nextTime);
            if (nextTime.m == 0 && nextTime.s == 0) {
                endGame(timerId, 'Loose', 'Try again')
            };
        }, 1000);

        this._isStarted = true;
        return timerId;
    }

    get isStarted() {
        return this._isStarted;
    }

    set isStarted(isStarted) {
        this._isStarted = isStarted;
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

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }

    return a;
}

function splitTextToTags(str) {
    let notificationText = document.querySelector('.notification-text');
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
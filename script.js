let cellsWidth = 4;
let cellsHeight = 3;
let time = {m: 1, s: 0};
let gameStarted = false;
let timerId;

let emojis = ['🐶','🐱','🐭','🐹','🐰','🐻','🐼','🐨','🐯','🦁',
'🐮','🐷','🐸','🐙','🐵','🦄','🐞','🦀','🐟',
'🐊','🐓','🦃','🐿', '🐬', '🐳', '🐋', '🐏', '🐑', '🐡'];
let openedCards = [];

function initGame() {
    let card = document.querySelector('.card');
    
    let shuffled = shuffleCards();

    let grid = initGrid();
    grid.addEventListener('click', (event) => addCardEventListeners(event), true);

    let playAgainBtn = document.querySelector('.play-again-button');
    playAgainBtn.addEventListener('click', (event) => playAgain()) 
    
    let timer = document.querySelector('.timer');
    let timeInternal = time;
    timer.textContent = formatTime(timeInternal);

    function initGrid() {
        let cardGrid = document.getElementById('card-grid');
        cardGrid.style.gridTemplateColumns = 'repeat(' + (cellsWidth - 1) + ', 130px 25px) 130px';
        cardGrid.style.gridTemplateRows = 'repeat(' + (cellsHeight - 1) + ', 130px 25px) 130px';

        for (var i = 1; i <= cellsHeight*2; i+=2) {
            let gridRowStart = i;
            let gridRowEnd = i + 1;
            for (var j = 1; j <= cellsWidth*2; j+=2) {
                let gridColumnStart = j;
                let gridColumnEnd = j + 1;
                var newCard = i == 1 && j == 1 ? card : card.cloneNode(true);
                newCard.classList.add('close-card');
                newCard.style.display = 'inline-block';
                
                var cardBack = Array.from(newCard.getElementsByClassName('card-back'))[0];
                cardBack.textContent = shuffled[(i - 1)/2*cellsWidth + (j - 1)/2];
    
                newCard.style.gridArea = gridRowStart + ' / ' + gridColumnStart + ' / ' + gridRowEnd + ' / ' + gridColumnEnd;
                cardGrid.appendChild(newCard);
            }
        }

        return cardGrid;
    }

    function addCardEventListeners(event) {
        var target = event.target;
        var parent = target.parentElement;

        if (target.classList.contains('card-grid') || target.classList.contains('card') || parent.classList.contains('freezed')) {
            return;
        }
        
        if (target.classList.contains('card-front') && !gameStarted) {
            timerId = startTimer();
            gameStarted = true;
        }

        if (isOpened(parent)) {
            parent.classList.remove('open-card');
            parent.classList.add('close-card');
        }
        else {
            parent.classList.add('open-card');
            parent.classList.remove('close-card');
            parent.classList.add('freezed');
            
            switch (openedCards.length) {
                case 0: 
                    openedCards.push(parent);
                    break;
                case 1: 
                    if (parent.textContent == openedCards[0].textContent) { // todo match function
                        openedCards[0].querySelector('.card-back').classList.add('match');
                        parent.querySelector('.card-back').classList.add('match');
                        openedCards[0].classList.add('freezed');
                        openedCards = [];
                        if (Array.from(document.getElementsByClassName('open-card')).length == cellsWidth * cellsHeight) {
                            endGame(timerId, 'Win', 'Play again');
                        }
                            
                    }
                    else {
                        openedCards[0].querySelector('.card-back').classList.add('mismatch');
                        parent.querySelector('.card-back').classList.add('mismatch');
                        openedCards[0].classList.add('freezed');
                        openedCards.push(parent);
                    }
                    break;
                case 2:
                    openedCards.forEach(c => {
                        c.querySelector('.card-back').classList.remove('mismatch');
                        c.classList.remove('freezed');
                        c.classList.remove('open-card');
                        c.classList.add('close-card');
                    })
    
                    openedCards = [ parent ];
                    break;
            }
        }
    }

    function open(card) {
        card.classList.remove('close-card');
        card.classList.add('open-card');
    }

    function close(card, quick) {
        card.classList.remove('open-card');
        card.classList.add('close-card');
        if (quick) 
            card.style.transition = 'transform .2s';
    }

    function isOpened(card) {
        return card.classList.contains('open-card')
    }

    function shuffleCards() {
        let shuffled = shuffle(emojis).slice(0, cellsWidth * cellsHeight / 2);
        let shuffled2 = shuffled.concat(shuffled);
        return shuffle(shuffled2);
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

    function startTimer() {
        let timer = document.querySelector('.timer');
        let timeInternal = time;
        timer.textContent = formatTime(timeInternal);
        let timerId = setInterval(() => {
            timeInternal = getNextTimerValue(timeInternal);
            timer.textContent = formatTime(timeInternal);
            if (timeInternal.m == 0 && timeInternal.s == 0) { 
                endGame(timerId, 'Loose', 'Try again')
            };
        }, 1000);
        return timerId;
    }

    function getNextTimerValue(t) {
        return (t.s > 0) ? { m: t.m, s: t.s - 1 } : { m: t.m - 1, s: 59 };
    }

    function formatTime(t) {
        return leadingZero(t.m) + ':' + leadingZero(t.s);
    }

    function leadingZero(num) {
        return (num >= 10 ? '' : '0') + num.toString();
    }

    function endGame(timerId, resultText, buttonText) {
        clearInterval(timerId);
        document.querySelector('.fullscreen').style.display = 'flex';
        document.querySelector('.notification').style.display = 'flex';
        splitTextToTags(resultText);       
        document.querySelector('.play-again-text').textContent = buttonText;
    }

    function splitTextToTags(str) {
        let notificationText = document.querySelector('.notification-text');
        let delay = 0;
        Array.from(notificationText.getElementsByTagName('p')).forEach(p => notificationText.removeChild(p));
        for (var i = 0; i < str.length; i++) {
            let char = document.createElement('p');
            // char.style.animationDelay = delay.toString() + 's';
            // delay += 0.2;
            char.textContent = str.charAt(i);
            char.animate([
                {transform: 'rotate3d(1, 0, 0, 0deg)'},
                {transform: 'rotate3d(1, 0, 0, 70deg)'},
                {transform: 'rotate3d(1, 0, 0, 0deg)'}

            ], {
                duration: 1200,
                iterations: Infinity,
                easing: 'ease-out',
                delay: i*100,
            }
        );
            notificationText.appendChild(char);
          }
    }

    function playAgain() {
        let shuffled = shuffleCards(emojis);
        let nextEmoji = getNext(shuffled);
        Array.from(document.getElementsByClassName('card')).forEach(c => {
            clear(c);
            setTimeout(function() {
                c.querySelector('.card-back').textContent = nextEmoji();
                c.style.transition = 'transform .5s';
            }, 200);
        });
        
        openedCards = [];
        document.querySelector('.fullscreen').style.display = 'none';
        timerId = startTimer();
    }

    function clear(card) {
        close(card, true);
        card.classList.remove('freezed');
        let cardBack = card.querySelector('.card-back');
        cardBack.classList.remove('match');
        cardBack.classList.remove('mismatch');
    }

    function getNext(arr) {
        let counter = 0;
        return function() {
            let next = arr[counter]; counter += 1; return next;
        }
    }
}
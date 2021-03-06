// After the html and css have loaded, setup the board and stuff
window.addEventListener('load', function(){
    // Get the css variable for the square size
    window.square_size = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--square-size')
    )
    window.padding = square_size/4

    // Setup
    setupGame()
    setupBoard()

    // Link play again button to reset function
    window.play_again_button = document.getElementsByClassName('play-again-icon')[0]
    window.play_again_button.onclick = function(e) {reset()}
})

function setupGame() {
    // Easier reference to the connect 4 element
    window.connect_4 = document.getElementsByClassName('connect-4')[0]

    // Initial value for the mouse column, out of range
    window.column = -1

    // Game variables
    window.gamestate = ['','','','','','',''] // setup empty game
    window.winner = false
    window.hover = true

    window.turn = 'yellow'
    setText('Yellow\'s turn')

    window.score = {'yellow': 0, 'red': 0}
    updateScoreboard()

    // Set click & move function
    window.connect_4.onmousemove = function(e) {onMouseMove(e)}
    window.connect_4.onclick = function(e) {onClick(e)}
    window.connect_4.onmouseout = function(e) {onMouseOut(e)}
}

function setupBoard() {
    // Reference the board section
    var board = document.getElementsByClassName('connect-4-board')[0]

    // each square's id is:
    // connect-4-board-square-column-row
    for (row=5; row>=0; row--) {
        for (column=0; column<7; column++) {
            square = document.createElement('div')
            square.className = 'connect-4-board-square empty'
            square.id = `connect-4-board-square-${column}-${row}`

            board.appendChild(square)
        }
    }

    // Reference the hover section
    var hover = document.getElementsByClassName('connect-4-hover')[0]

    for (i=0; i<7; i++) {
        square = document.createElement('div')
        square.className = 'connect-4-hover-square transparent'
        square.id = `connect-4-hover-square-${i}`

        hover.appendChild(square)
    }

    // Add them to the element
    window.connect_4.appendChild(hover)
    window.connect_4.appendChild(board)

    console.log('Created the board')
}

function reset() {
    // Spin Animation
    setAnimation(window.play_again_button, 'spin', 1000)

    // Remove hovering squares
    clearAllHovers()
    window.hover = false

    // Set board squares to empty
    clearAllTokens()

    // Game variables
    window.gamestate = ['','','','','','',''] // setup empty game
    window.winner = false
    window.hover = true


    // If there have been an even number of games, yellow goes first
    // Otherwise red goes first
    if ( (window.score['yellow'] + window.score['red']) % 2 == 0) {
        window.turn = 'yellow'
        setText('Yellow\'s turn')
    }
    else {
        window.turn = 'red'
        setText('Red\'s turn')
    }

}
// ----- BOARD FUNCTIONS -----



// ----- MOUSE FUNCTIONS -----

// Handle the mouse moving
function onMouseMove(event) {
    if (window.hover) {
        var new_column = getMouseColumn(event)
    
        // console.log('Moved in column ' + new_column)
    
        if (new_column != window.column) {
            // Remove the hovering token from where it was and add it to the new column
            setHover(window.column, 'transparent')
            setHover(new_column, window.turn)
            window.column = new_column
        }
    
    }
}

function onMouseOut(event) {
    clearAllHovers()
}

// Handle mouse clicks
function onClick(event) {
    if (window.winner != false) {
        // If the game is already over, don't bother tracking where the mouse is and stuff
        return false
    }

    // when the mouse is clicked, update the column it's in
    // i didn't think this was necessary but it breaks without it
    window.column = getMouseColumn(event)
    // console.log('Clicked column ' + window.column)

    num_pieces_in_column = window.gamestate[window.column].length

    if (num_pieces_in_column < 6) {
        // Add the first letter of the color to that column in the gamestate
        window.gamestate[window.column] += window.turn[0]
        
        // Drop the piece (the number of pieces previously in the columna also happens to be the y coordinate)
        document.getElementById(`connect-4-board-square-${window.column}-${num_pieces_in_column}`).className = 'connect-4-board-square ' + window.turn
        setToken(window.column, num_pieces_in_column, window.turn)

        // Change who's turn it is
        if (window.turn == 'yellow') {
            window.turn = 'red'
            setText('Red\'s turn')
        }
        else {
            window.turn = 'yellow'
            setText('Yellow\'s turn')
        }

        //Update the hovering token
        setHover(window.column, window.turn)

        // Get the winner (could be false)
        winner = getWinner(window.gamestate)

        if (winner) {
            window.winner = winner
            window.score[winner] ++
            updateScoreboard()
            
            // Show the winner
            if (winner == 'yellow') {
                setText('Yellow wins!')
            }
            else if (winner == 'red'){
                setText('Red wins!')
            }
            else if (winner == 'draw') {
                setText('It\'s a draw!')
            }

            // Remove the hovering tokens
            clearAllHovers()
            window.hover = false
        }

        
    }
    else {
        console.log('That column is full')
    }

}

// Gets the board column that the mouse is in
function getMouseColumn(event) {
    //the size/position of the connect 4 div
    var rect = window.connect_4.getBoundingClientRect()
        
    // rect.x is the x position of the connect 4 div (top left)
    // padding is the padding to the left
    // event.clientX gives the position of the mouse

    // from these, calculate which column the mouse is in:
    return Math.floor((event.clientX - rect.x - window.padding)/window.square_size)
}

// ----- GAME FUNCTIONS -----

// Get the winner of a game
// will return: 'yellow', 'red', 'draw' or false
function getWinner(gamestate) {
    // vertical
    for (column=0; column<7; column++) {
        var column_string = gamestate[column]
        var winner = fourInARow(column_string)
        if (winner) {
            return winner
        }
    }

    // horizontal
    for (row=0; row<6; row++) {
        var row_string = ''
        for (column=0; column<7; column++) {
            var token = gamestate[column][row]
            if (token === undefined) {
                row_string += ' '
            }
            else {
                row_string += token
            }
        }

        var winner = fourInARow(row_string)
        if (winner) {
            return winner
        }
    }

    // diagonal
    // yes, i couldve calculated this each time but writing it out wasn't too bad and it's faster at runtime
    // each pos is (column, row)
    var diagonals = [
        //
        [[0,3],[1,2],[2,1],[3,0]],
        [[0,4],[1,3],[2,2],[3,1],[4,0]],
        [[0,5],[1,4],[2,3],[3,2],[4,1],[5,0]],
        [[1,5],[2,4],[3,3],[4,2],[5,1],[6,0]],
        [[2,5],[3,4],[4,3],[5,2],[6,1]],
        [[3,5],[4,4],[5,3],[6,2]],
        //
        [[0,2],[1,3],[2,4],[3,5]],
        [[0,1],[1,2],[2,3],[3,4],[4,5]],
        [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5]],
        [[1,0],[2,1],[3,2],[4,3],[5,4],[6,5]],
        [[2,0],[3,1],[4,2],[5,3],[6,4]],
        [[3,0],[4,1],[5,2],[6,3]]
    ]

    for (diagonal in diagonals) {
        var diagonal_string = ''

        for (i in diagonals[diagonal]) {
            var pos = diagonals[diagonal][i]
            var token = gamestate[pos[0]][pos[1]]
            if (token === undefined) {
                diagonal_string += ' '
            }
            else {
                diagonal_string += token
            }
        }
        
        var winner = fourInARow(diagonal_string)
        if (winner) {
            return winner
        }
    }

    // if there's no winners, check if the board is full
    full = true
    for (column in gamestate) {
        if (gamestate[column].length < 6) {
            full = false
        }
    }
    // if it's full, it's a draw
    if (full) {
        return 'draw'
    }

    return false
}

// Given a string, check if there is a four in a row in it
function fourInARow(string) {
    if (string.includes('yyyy')) {
        return 'yellow'
    }
    else if (string.includes('rrrr')) {
        return 'red'
    }
    return false
}

// ----- VISUAL FUNCTIONS -----

function setToken(column, row, color) {
    document.getElementById(`connect-4-board-square-${column}-${row}`).className = 'connect-4-board-square ' + color
}

function clearAllTokens() {
    for (row=5; row>=0; row--) {
        for (column=0; column<7; column++) {
            setToken(column, row, 'empty')
        }
    }
}

// Displaying the hovering token
function setHover(column, color) {
    // column should be a number from 0 - 6
    // color can be: 'red' 'yellow' or 'transparent'

    if (column >= 0 && column <=6) {
        document.getElementById(`connect-4-hover-square-${column}`).className = 'connect-4-hover-square ' + color
    }
}

// Get rid of the hovering token, wherever it is
function clearAllHovers() {
    for (column=0; column<7; column++) {
        setHover(column, 'transparent')
    }
}

// Sets the text displayed under the board
function setText(string) {
    document.getElementsByClassName('info-text')[0].innerHTML = string
}

function updateScoreboard() {
    y = document.getElementsByClassName('yellow-score')[0]
    y.innerHTML = window.score['yellow']

    r = document.getElementsByClassName('red-score')[0]
    r.innerHTML = window.score['red']
}

function setAnimation(element, animation_name, length) {
    element.classList.add(animation_name)
    setTimeout(
        function() {
            element.classList.remove(animation_name)
        },
        length + 100
    )
}
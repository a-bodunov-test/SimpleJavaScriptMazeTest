(function(){

    class MazeRoom{
        
        constructor(){
            this.passage = new Object();
            this.passage.top = false;
            this.passage.left = false;
            this.passage.bottom = false;
            this.passage.right = false;
        }

        setCoords(x, y) {
            this.x = x;
            this.y = y;
        }

        setPass(side){
            switch(side){
                case 'top': return this.passage.top = true; break;
                case 'left': return this.passage.left = true; break;
                case 'bottom': return this.passage.bottom = true; break;
                case 'right': return this.passage.right = true; break;
            }
        }

        setIsWay(isWay){
            this.isWay = isWay;
        }

        setIsVisited(isVisited){
            this.isVisited = isVisited;
        }

        setIsPosition(isPosition){
            this.isPosition = isPosition;
        }

        canPass(side){
            switch(side){
                case 'top': return this.passage.top; break;
                case 'left': return this.passage.left; break;
                case 'bottom': return this.passage.bottom; break;
                case 'right': return this.passage.right; break;
            }
        }

        getHtml(showWay){
            let td = document.createElement('td');
            if (!this.passage.top) td.classList.add('border-top');
            if (!this.passage.left) td.classList.add('border-left');
            if (!this.passage.bottom) td.classList.add('border-bottom');
            if (!this.passage.right) td.classList.add('border-right');
            if (this.isWay && showWay) td.classList.add('way');
            if (this.isVisited) td.classList.add('visited');
            if (this.isPosition) td.classList.add('position');
            return td;
        }

    }

    class Maze{

        posX = 0; posY = 0;

        constructor(size){
            this.size = size;
        }

        goto(side){
            let isWon = false;
            let currentRoom = this.maze[this.posX][this.posY];
            if (currentRoom.canPass(side)){
                let newPosition = getSideCoordinates(this.posX, this.posY, side);
                if (newPosition.x < 0 || newPosition.x >= this.size ||
                    newPosition.y < 0 || newPosition.y >= this.size){
                        alert('You won!!!');
                        isWon = true;
                } else {
                    this.maze[this.posX][this.posY].setIsPosition(false);
                    this.posX = newPosition.x;
                    this.posY = newPosition.y;
                    this.maze[this.posX][this.posY].setIsVisited(true);
                    this.maze[this.posX][this.posY].setIsPosition(true);
                }
                document.body.innerHTML = '';
                document.body.append(maze.getHtml(isWon))
            }
        }

        getHtml(showWay){
            let table = document.createElement('table');
            table.classList.add('maze');
            for (let i = 0; i < this.size; i++){
                let tr = document.createElement('tr');
                for (let j = 0; j < this.size; j++){
                    tr.append(this.getRoomHtml(this.maze[j][i], showWay));
                }
                table.append(tr);
            }
            return table;
        }

        getRoomHtml(room, showWay){
            if (room == null){
                return document.createElement('td').classList.add('none');
            } else {
                return room.getHtml(showWay);
            }
        }

    }

    class MazeGenerator{
        wallProbablity = 0.5;
        minWayLength = 100;
        wayLength = 0;
        deadendRooms = [];

        generate(size){
            this.size = size;
            this.maze = new Array(size);
            for (let i = 0; i < size; i++){
                this.maze[i] = new Array(size);
            }
            this.createWayRoom(0, 0); // рекурсивно создает дерево лабиринта с одним проходом и множеством тупиков
            this.generateDeadends();
            this.fillEmptiness();
            
            let maze = new Maze(size);
            maze.maze = this.maze;
            this.maze[0][0].setIsPosition(true);
            return maze;
        }

        createWayRoom(x, y){
            // создает комнату - часть прохода
            let room = this.createRoom(x, y, true);
            if (room == null) return true;
            let isDeadEnd;
            do{
                let freeSides = this.wayLength >= this.minWayLength ? this.getFreeSidesWithExit(x, y) : this.getFreeSides(x, y);
                if (freeSides.length == 0){ //мы попали в тупик
                    room.isWay = false;
                    return false;
                }

                let wayContinueSide = this.getRandom(freeSides);
                room.setPass(wayContinueSide);
                this.wayLength++;
                let nextRoomCoordinates = getSideCoordinates(x, y, wayContinueSide);
                isDeadEnd = !this.createWayRoom(nextRoomCoordinates.x, nextRoomCoordinates.y); // вернет true, если в этом направлении нет нетупиковых веток
                this.wayLength--;
            } while (isDeadEnd);

            this.deadendRooms.push({x: x, y: y});
            return true;
        }

        generateDeadends(){
            while (this.deadendRooms.length != 0){   

                this.createDeadends(this.deadendRooms[0].x, this.deadendRooms[0].y);
                this.deadendRooms.splice(0, 1);

            }
        }

        fillEmptiness(){
            for (let i = 0; i < this.size; i++){
                for (let j = 0; j < this.size; j++){
                    if (this.maze[i][j] == null){ // emptiness found
                        // find not emtpy neighbor rooms
                        let freeSides = this.getFreeSides(i, j);
                        let neighborRooms = ['top', 'right', 'bottom', 'left'].filter(side => !freeSides.includes(side));
                        let size= this.size;
                        neighborRooms = neighborRooms.filter(function(side){
                            let coordinates = getSideCoordinates(i, j, side);
                            return (coordinates.x >= 0 && coordinates.x < size &&
                                    coordinates.y >= 0 && coordinates.y < size);
                        })

                        // choose room to set pass from
                        let passFrom = this.getRandom(neighborRooms);

                        // setting neighbor room pass to new room
                        let passFromCoordinates = getSideCoordinates(i, j, passFrom);
                        let oppositePass = (passFrom == 'top' ? 'bottom' : (passFrom == 'right' ? 'left' : (passFrom == 'bottom' ? 'top' : 'right')));
                        this.maze[passFromCoordinates.x][passFromCoordinates.y].setPass(oppositePass);

                        // add new deadend room
                        this.createDeadendRoom(i, j)
                        this.deadendRooms.push({x: i, y: j});

                        // try to fill emptiness around
                        this.generateDeadends()
                    }
                }
            }
        }

        createDeadends(x, y){
            // создает комнату - часть тупика
            let room = this.maze[x][y];
            let freeSides = this.getFreeSides(x, y);
            for (let i = 0; i < freeSides.length; i++){
                if (Math.random() > this.wallProbablity){
                    room.setPass(freeSides[i]);
                    let newRoomCoordinates = getSideCoordinates(x, y, freeSides[i]);
                    this.createDeadendRoom(newRoomCoordinates.x, newRoomCoordinates.y);
                }
            }
            
        }

        createDeadendRoom(x, y){
            let room = this.createRoom(x, y, false);
            if (room == null) return;
            this.deadendRooms.push({x: x, y: y});
        }

        createRoom(x, y, isWay){
            // создает комнату
            if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null;
            let room = new MazeRoom();
            room.setCoords(x, y);
            room.isWay = isWay;
            this.maze[x][y] = room;
            let neighborRoomsPasses = this.getNeighborRoomsPasses(x, y);
            for (let i = 0; i < neighborRoomsPasses.length; i++){
                room.setPass(neighborRoomsPasses[i]);
            }
            return room;
        }

        getFreeSides(x, y){
            // определяет незанятые направления
            let freeSides = [];
            if (y - 1 >= 0 && this.maze[x][y - 1] == null) freeSides.push('top');
            if (x - 1 >= 0 && this.maze[x - 1][y] == null) freeSides.push('left');
            if (y + 1 < this.size && this.maze[x][y + 1] == null) freeSides.push('bottom');
            if (x + 1 < this.size && this.maze[x + 1][y] == null) freeSides.push('right');
            return freeSides;
        }

        getFreeSidesWithExit(x, y){
            // определяет незанятые направления с возможность закончить путь (выход)
            let freeSides = [];
            if (y - 1 < 0 || this.maze[x][y - 1] == null) freeSides.push('top');
            if (x - 1 < 0 || this.maze[x - 1][y] == null) freeSides.push('left');
            if (y + 1 >= this.size || this.maze[x][y + 1] == null) freeSides.push('bottom');
            if (x + 1 >= this.size || this.maze[x + 1][y] == null) freeSides.push('right');
            return freeSides;
        }

        getNeighborRoomsPasses(x, y){
            // определят, есть ли у соседних комнат проход в текущюю
            let passes = [];
            if (y - 1 >= 0        && this.maze[x][y - 1] != null && this.maze[x][y - 1].canPass('bottom')) passes.push('top');
            if (x - 1 >= 0        && this.maze[x - 1][y] != null && this.maze[x - 1][y].canPass('right'))  passes.push('left');
            if (y + 1 < this.size && this.maze[x][y + 1] != null && this.maze[x][y + 1].canPass('top'))    passes.push('bottom');
            if (x + 1 < this.size && this.maze[x + 1][y] != null && this.maze[x + 1][y].canPass('left'))   passes.push('right');
            return passes;
        }

        getRandom(array){
            let randoIndex = Math.floor(Math.random() * array.length);
            return array[randoIndex];
        }
    }

    function getSideCoordinates(x, y, side){
        // определяет координаты по данному направлению и создает комнату
        let nextX, nextY;
        switch (side){
            case 'top': nextX = x; nextY = y - 1; break;
            case 'left': nextX = x - 1; nextY = y; break;
            case 'bottom': nextX = x; nextY = y + 1; break;
            case 'right': nextX = x + 1; nextY = y; break;
        }
        return {x: nextX, y: nextY};
    }

    let maze = new MazeGenerator().generate(20);
    document.body.append(maze.getHtml())

    addEventListener("keydown", function(event) {
        if (event.keyCode == 37)
            maze.goto('left');
        if (event.keyCode == 38)
            maze.goto('top');
        if (event.keyCode == 39)
            maze.goto('right');
        if (event.keyCode == 40)
            maze.goto('bottom');
      });

})();
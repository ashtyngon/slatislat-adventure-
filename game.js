// Настройки игры
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    // Простая физика для столкновений
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    // Основные функции игры
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Создаем новую игру
const game = new Phaser.Game(config);

let player;
let cursors;

// 1. Функция предзагрузки ассетов (картинок, звуков)
function preload () {
    // Пока у нас нет картинки, используем синий квадрат 32x48 пикселей
    // В будущем здесь будет ссылка на спрайт Слатислава
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/space3.png'); // Фон для примера
}

// 2. Функция создания игровых объектов в начале
function create () {
    this.add.image(400, 300, 'sky'); // Добавляем фон

    // Создаем "игрока" как физический объект (спрайт)
    player = this.physics.add.sprite(400, 300, null);
    player.setSize(32, 48); // Размер для физики
    player.setCollideWorldBounds(true); // Не даем уйти за пределы экрана

    // Создаем объект для отслеживания нажатий клавиш (стрелок)
    cursors = this.input.keyboard.createCursorKeys();
}

// 3. Функция, которая выполняется каждый кадр (здесь происходит движение)
function update () {
    // Обнуляем скорость игрока перед каждым кадром
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-200);
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);
    }
}

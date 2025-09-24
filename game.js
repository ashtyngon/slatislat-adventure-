const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Ноты падают вниз
            debug: false
        }
    }
};

new Phaser.Game(config);

let hitZones;
let notes;
let player;
let cursors;
let scoreText, comboText;
let score = 0;
let combo = 0;
let lastNoteTime = 0;
const noteSpawnInterval = 1000;
const noteLanes = [250, 350, 450, 550];

function preload() {
    // Загружаем ОДИН большой спрайт-шит
    this.load.image('ui_sheet', 'assets/ui_big_pieces.png');
    this.load.image('slatislav', 'assets/slatislav.png');
}

function create() {
    // --- "Нарезаем" спрайт-шит на отдельные картинки в памяти ---
    // Координаты (x, y, ширина, высота) взяты из файла ui_big_pieces.png
    this.textures.get('ui_sheet').add('background_panel', 0, 0, 140, 86, 86);
    this.textures.get('ui_sheet').add('note_button', 0, 542, 32, 149, 29);
    this.textures.get('ui_sheet').add('zone_slot', 0, 0, 300, 45, 45);
    
    // --- Создание сцены ---
    // Используем 'background_panel' как фон
    this.add.tileSprite(400, 300, 800, 600, 'ui_sheet', 'background_panel');
    player = this.add.sprite(120, 450, 'slatislav').setScale(0.5);

    // --- Создание интерактивных зон ---
    hitZones = this.physics.add.staticGroup();
    for (let i = 0; i < 4; i++) {
        // Используем 'zone_slot' для зон удара
        let zone = hitZones.create(noteLanes[i], 550, 'ui_sheet', 'zone_slot');
        zone.setData('lane', i);
        zone.setAlpha(0.5);
    }

    // --- Группа для падающих нот ---
    notes = this.physics.add.group();
    this.physics.add.overlap(notes, hitZones, noteHit, null, this);

    // --- Управление ---
    cursors = this.input.keyboard.createCursorKeys();

    // --- Интерфейс ---
    const textStyle = { fontFamily: '"Cinzel", serif', fontSize: '32px', fill: '#ffc300', stroke: '#000', strokeThickness: 4 };
    scoreText = this.add.text(550, 50, 'Очки: 0', textStyle);
    comboText = this.add.text(550, 100, 'Комбо: 0', textStyle);
    
    this.input.keyboard.on('keydown', handleKeyPress, this);
}

function update(time) {
    if (time > lastNoteTime + noteSpawnInterval) {
        spawnNote();
        lastNoteTime = time;
    }

    notes.children.each(note => {
        if (note.y > 620) {
            missedNote(note);
        }
    });
}

function spawnNote() {
    const lane = Phaser.Math.Between(0, 3);
    // Используем 'note_button' для падающих нот
    const note = notes.create(noteLanes[lane], 0, 'ui_sheet', 'note_button');
    note.setData('lane', lane);
    note.setVelocityY(200 + (score / 100));
}

function handleKeyPress(event) {
    let laneIndex = -1;
    switch (event.code) {
        case 'ArrowLeft':  laneIndex = 0; break;
        case 'ArrowDown':  laneIndex = 1; break;
        case 'ArrowUp':    laneIndex = 2; break;
        case 'ArrowRight': laneIndex = 3; break;
    }

    if (laneIndex !== -1) {
        const targetZone = hitZones.children.entries[laneIndex];
        this.tweens.add({ targets: targetZone, alpha: 1, yoyo: true, duration: 100 });

        let hit = false;
        notes.children.each(note => {
            if (note.getData('lane') === laneIndex && Math.abs(note.y - targetZone.y) < 50) {
                noteHit(note, targetZone);
                hit = true;
            }
        });

        if (!hit) {
            resetCombo();
        }
    }
}

function noteHit(note, zone) {
    score += 10 * (1 + combo / 10);
    combo++;
    scoreText.setText('Очки: ' + Math.floor(score));
    comboText.setText('Комбо: ' + combo);

    const emitter = this.add.particles(note.x, note.y, 'ui_sheet', 'zone_slot', {
        speed: 200,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        tint: 0xffc300
    });
    emitter.explode(16);

    this.cameras.main.shake(100, 0.01);
    
    this.tweens.add({
        targets: player,
        scaleX: 0.55,
        scaleY: 0.45,
        yoyo: true,
        duration: 80,
        ease: 'Power1'
    });
    
    note.destroy();
}

function missedNote(note) {
    resetCombo();
    this.cameras.main.flash(200, 255, 0, 0);
    note.destroy();
}

function resetCombo() {
    combo = 0;
    comboText.setText('Комбо: 0');
}

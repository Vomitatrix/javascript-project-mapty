'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now();

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace;
    }

    get calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed;
    }

    get calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

/////////////////////////////////////////////////
// ARCHITECTURE
class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        this.#getPosition();

        form.addEventListener('submit', this.#newWorkout.bind(this));
        inputType.addEventListener('change', this.#toggleElevationField);
    }

    #getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this.#loadMap.bind(this),
                () => {
                    alert('Could not get your position.');
                }
            );
        }
    }

    #loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this.#showForm.bind(this));
    }

    #showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    #toggleElevationField() {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    #newWorkout(e) {
        e.preventDefault();

        function validInputs(...inputs) {
            return inputs.every(input => Number.isFinite(input));
        }
        function allPositive(...inputs) {
            return inputs.every(input => input > 0);
        }

        const { lat, lng } = this.#mapEvent.latlng;
        const latlng = [lat, lng];
        const type = inputType.value;
        const dist = +inputDistance.value;
        const dura = +inputDuration.value;
        const inputs = [latlng, dist, dura];
        let workout;

        if (type === 'running') {
            const cade = +inputCadence.value;
            inputs.push(cade);

            if (
                !validInputs(dist, dura, cade) ||
                !allPositive(dist, dura, cade)
            ) {
                return alert('Inputs must be positive numbers');
            }

            workout = new Running(...inputs);
        }

        if (type === 'cycling') {
            const elev = +inputElevation.value;
            inputs.push(elev);

            if (!validInputs(dist, dura, elev) || !allPositive(dist, dura)) {
                return alert('Inputs must be positive numbers');
            }

            workout = new Cycling(...inputs);
        }

        this.#workouts.push(workout);
        this.#renderWorkoutMarker(workout);

        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';

        form.classList.add('hidden');
    }

    #renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    content: `${
                        workout.type[0].toUpperCase() + workout.type.slice(1)
                    } on ${
                        months[new Date().getMonth()]
                    } ${new Date().getDate()}`,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`
                })
            )
            .openPopup();
    }
}

const app = new App();

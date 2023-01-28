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

class App {
    #map;
    #mapEvent;
    #i = 0;

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
        const { lat, lng } = this.#mapEvent.latlng;
        const latlng = [lat, lng];
        this.#i++;

        L.marker(latlng)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    content: `Workout ${this.#i}\nDistance: ${
                        inputDistance.value
                    } km\nDuration: ${inputDuration.value} min\n${
                        inputType.value === 'running'
                            ? 'Cadence'
                            : 'Elevation Gain'
                    }: ${
                        inputType.value === 'running'
                            ? inputCadence.value + ' step/min'
                            : inputElevation.value + ' meters'
                    }`,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${inputType.value}-popup`
                })
            )
            .openPopup();

        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';

        form.classList.add('hidden');
    }
}

const app = new App();

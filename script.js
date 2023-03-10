'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now() + '';

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${
            this.type[0].toUpperCase() + this.type.slice(1)
        } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.#calcPace;
        this._setDescription();
    }

    get #calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.#calcSpeed;
        this._setDescription();
    }

    get #calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

/////////////////////////////////////////////////
// ARCHITECTURE
class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor() {
        this.#getPosition();

        form.addEventListener('submit', this.#newWorkout.bind(this));
        inputType.addEventListener('change', this.#toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this.#moveToPopup.bind(this)
        );
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

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this.#showForm.bind(this));
        this.#getLocalStorage();
    }

    #showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    #hideForm() {
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
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
        this.#renderWorkout(workout);
        this.#hideForm();
        this.#setLocalStorage();
    }

    #renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    content: `${workout.type === 'running' ? '????' : '????'} ${
                        workout.description
                    }`,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`
                })
            )
            .openPopup();
    }

    #renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.type === 'running' ? '????' : '????'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">????</span>
            <span class="workout__value">178</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `;
        }

        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">??????</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???????</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;
        }

        form.insertAdjacentHTML('afterend', html);
    }

    #moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoomLevel);
    }

    #setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    #getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
            this.#renderWorkout(work);
            this.#renderWorkoutMarker(work);
        });
    }

    static get reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();

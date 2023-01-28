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

let map,
    mapEvent,
    i = 0;
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude } = position.coords;
            const { longitude } = position.coords;

            const coords = [latitude, longitude];

            map = L.map('map').setView(coords, 13);

            L.tileLayer(
                'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
            ).addTo(map);

            map.on('click', mapE => {
                mapEvent = mapE;
                form.classList.remove('hidden');
                inputDistance.focus();
            });
        },
        () => {
            alert('Could not get your position.');
        }
    );
}

form.addEventListener('submit', e => {
    e.preventDefault();
    const { lat, lng } = mapEvent.latlng;
    const latlng = [lat, lng];
    i++;

    L.marker(latlng)
        .addTo(map)
        .bindPopup(
            L.popup({
                content: `Workout ${i}\nDistance: ${
                    inputDistance.value
                } km\nDuration: ${inputDuration.value} min\n${
                    inputType.value === 'running' ? 'Cadence' : 'Elevation Gain'
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
});

inputType.addEventListener('change', () => {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});

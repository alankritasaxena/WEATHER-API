const API_KEY = '957af83c7e67d70bb0d1c1f62e0a6317';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

const elements = {
  cityInput: document.getElementById('city-input'),
  searchBtn: document.getElementById('search-btn'),
  geoBtn: document.getElementById('geo-btn'),
  recentToggle: document.getElementById('recent-toggle'),
  recentList: document.getElementById('recent-list'),
  errorMessage: document.getElementById('error-message'),
  cityName: document.getElementById('city-name'),
  weatherDesc: document.getElementById('weather-desc'),
  tempValue: document.getElementById('temp-value'),
  tempUnitToggle: document.getElementById('temp-unit-toggle'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('wind-speed'),
  weatherAlert: document.getElementById('weather-alert'),
  forecast: document.getElementById('forecast'),
  appBody: document.getElementById('app-body'),
};

let currentTempCelsius = null;
let isCelsius = true;
let recentCities = [];

function saveRecentCity(city) {
  if (!recentCities.includes(city)) {
    recentCities.unshift(city);
    if (recentCities.length > 5) recentCities.pop();
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
  }
  renderRecentCities();
}

function renderRecentCities() {
  if (recentCities.length === 0) {
    elements.recentList.classList.add('hidden');
    return;
  }
  elements.recentList.innerHTML = '';
  recentCities.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.className = 'cursor-pointer px-4 py-2 hover:bg-blue-100';
    li.addEventListener('click', () => {
      fetchWeatherByCity(city);
      elements.recentList.classList.add('hidden');
    });
    elements.recentList.appendChild(li);
  });
}

function toggleRecentList() {
  elements.recentList.classList.toggle('hidden');
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
}

function clearError() {
  elements.errorMessage.textContent = '';
  elements.errorMessage.classList.add('hidden');
}

function setBackground(condition) {
  elements.appBody.className = 'transition-colors duration-500 min-h-screen flex flex-col items-center p-4';
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) elements.appBody.classList.add('bg-clear');
  else if (cond.includes('cloud')) elements.appBody.classList.add('bg-clouds');
  else if (cond.includes('rain') || cond.includes('drizzle')) elements.appBody.classList.add('bg-rain');
  else if (cond.includes('snow')) elements.appBody.classList.add('bg-snow');
  else if (cond.includes('thunderstorm')) elements.appBody.classList.add('bg-thunderstorm');
  else if (cond.includes('haze')) elements.appBody.classList.add('bg-haze');
  else if (cond.includes('warm')) elements.appBody.classList.add('bg-sunny');
  else elements.appBody.classList.add('bg-gradient-to-b', 'from-blue-400', 'to-blue-600');
}


function displayCurrentWeather(data) {
  clearError();
  elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
  elements.weatherDesc.textContent = data.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
  currentTempCelsius = kelvinToCelsius(data.main.temp);
  isCelsius = true;
  elements.tempValue.textContent = Math.round(currentTempCelsius);
  elements.tempUnitToggle.textContent = '°C';
  elements.humidity.textContent = data.main.humidity;
  elements.windSpeed.textContent = data.wind.speed;
  setBackground(data.weather[0].main);

  // Alert for extreme temperature
  if (currentTempCelsius > 40) {
    elements.weatherAlert.textContent = '⚠️ Extreme heat alert: Temperature above 40°C';
    elements.weatherAlert.classList.remove('hidden');
  } else if (currentTempCelsius < -10) {
    elements.weatherAlert.textContent = '⚠️ Extreme cold alert: Temperature below -10°C';
    elements.weatherAlert.classList.remove('hidden');
  } else {
    elements.weatherAlert.classList.add('hidden');
  }
}

function displayForecast(data) {
  elements.forecast.innerHTML = '';

  const dailyData = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toISOString().split('T')[0];
    if (!dailyData[day] && date.getHours() >= 11 && date.getHours() <= 13) {
      dailyData[day] = item;
    }
  });

  let count = 0;
  for (const day in dailyData) {
    if (count >= 5) break;
    const item = dailyData[day];
    const date = new Date(item.dt * 1000);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const dayName = date.toLocaleDateString(undefined, options);
    const tempC = kelvinToCelsius(item.main.temp);
    const wind = item.wind.speed;
    const humidity = item.main.humidity;
    const icon = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const card = document.createElement('div');
    card.className = 'bg-teal-400 rounded p-4 text-center flex flex-col items-center shadow';

    card.innerHTML = `
      <h3 class="font-semibold mb-2">${dayName}</h3>
      <img src="${iconUrl}" alt="${item.weather[0].description}" class="w-16 h-16 mx-auto" />
      <div class="mt-2 text-lg font-bold">${Math.round(tempC)}°C</div>
      <div class="mt-1 flex justify-center gap-3 text-sm text-gray-700">
        <div title="Wind Speed">
          <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>${wind} m/s
        </div>
        <div title="Humidity">
          <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 10h1M20 10h1M12 3v1M12 20v1M16.24 7.76l-.71.71M7.76 16.24l-.71.71M16.24 16.24l-.71-.71M7.76 7.76l-.71-.71"></path>
          </svg>${humidity}%
        </div>
      </div>
    `;

    elements.forecast.appendChild(card);
    count++;
  }
}

function kelvinToCelsius(k) {
  return k - 273.15;
}

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function toggleTemperatureUnit() {
  if (currentTempCelsius === null) return;
  if (isCelsius) {
    const f = celsiusToFahrenheit(currentTempCelsius);
    elements.tempValue.textContent = Math.round(f);
    elements.tempUnitToggle.textContent = '°F';
    isCelsius = false;
  } else {
    elements.tempValue.textContent = Math.round(currentTempCelsius);
    elements.tempUnitToggle.textContent = '°C';
    isCelsius = true;
  }
}

async function fetchWeatherByCity(city) {
  if (!city.trim()) {
    showError('Please enter a city name.');
    return;
  }
  clearError();
  try {
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}`);
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}`);
    if (!forecastRes.ok) throw new Error('Forecast not found');
    const forecastData = await forecastRes.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData);
    saveRecentCity(currentData.name);
  } catch (error) {
    showError(error.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  clearError();
  try {
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!currentRes.ok) throw new Error('Location weather not found');
    const currentData = await currentRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!forecastRes.ok) throw new Error('Forecast not found');
    const forecastData = await forecastRes.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData);
    saveRecentCity(currentData.name);
  } catch (error) {
    showError(error.message);
  }
}

function handleSearchClick() {
  const city = elements.cityInput.value;
  fetchWeatherByCity(city);
}

function handleGeoClick() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    () => {
      showError('Unable to retrieve your location.');
    }
  );
}

function handleRecentToggleClick() {
  if (elements.recentList.classList.contains('hidden')) {
    if (recentCities.length === 0) return;
    renderRecentCities();
    elements.recentList.classList.remove('hidden');
  } else {
    elements.recentList.classList.add('hidden');
  }
}

function loadRecentCities() {
  const stored = localStorage.getItem('recentCities');
  if (stored) {
    recentCities = JSON.parse(stored);
  }
}

function init() {
  loadRecentCities();
  elements.searchBtn.addEventListener('click', handleSearchClick);
  elements.geoBtn.addEventListener('click', handleGeoClick);
  elements.tempUnitToggle.addEventListener('click', toggleTemperatureUnit);
  elements.recentToggle.addEventListener('click', handleRecentToggleClick);

  document.addEventListener('click', e => {
    if (!elements.recentToggle.contains(e.target) && !elements.recentList.contains(e.target)) {
      elements.recentList.classList.add('hidden');
    }
  });

  elements.cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearchClick();
  });
}

init();

function applyResponsiveStyles() {
  const cards = document.querySelectorAll('.card');
  const width = window.innerWidth;

  if (width <= 375) { // For iPhone SE
    cards.forEach(card => card.style.flex = '1 1 100%');
  } else if (width <= 768) { //  For iPad Mini
    cards.forEach(card => card.style.flex = '1 1 50%');
  } else { // For Desktop
    cards.forEach(card => card.style.flex = '1 1 33.333%');
  }
}

// Apply on load
applyResponsiveStyles();

// Apply on window resize
window.addEventListener('resize', applyResponsiveStyles);

let forecastDataGlobal = null;

const apiKey = "511b9afc0e3e594a616ae4e55e47106d"; // Replace with your actual OpenWeatherMap API key

// Dark mode toggle
document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Event listeners
document.getElementById("searchBtn").addEventListener("click", getWeather);
document.getElementById("getLocation").addEventListener("click", getLocationWeather);
document.getElementById("toggleForecast").addEventListener("click", showForecast);

// Fetch weather using geolocation
function getLocationWeather() {
  const weatherInfo = document.getElementById("weatherInfo");

  if (!navigator.geolocation) {
    weatherInfo.innerHTML = "<p>Geolocation is not supported by your browser.</p>";
    return;
  }

  weatherInfo.innerHTML = "<p>Fetching your location...</p>";

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (!currentRes.ok) throw new Error("Failed to fetch current weather");
      const currentData = await currentRes.json();

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (!forecastRes.ok) throw new Error("Failed to fetch forecast");
      const forecastData = await forecastRes.json();

      displayWeather(currentData, forecastData);
    } catch (error) {
      weatherInfo.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
      console.error(error);
    }
  },
  (error) => {
    weatherInfo.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  });
}

// Fetch weather by city
async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const weatherInfo = document.getElementById("weatherInfo");

  if (!city) {
    weatherInfo.innerHTML = "<p>Please enter a city name.</p>";
    return;
  }

  weatherInfo.innerHTML = "<p>Loading...</p>";

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    if (!currentRes.ok) throw new Error("City not found");
    const currentData = await currentRes.json();

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    if (!forecastRes.ok) throw new Error("Failed to fetch forecast");
    const forecastData = await forecastRes.json();

    saveToHistory(city);
    displayWeather(currentData, forecastData);
  } catch (error) {
    weatherInfo.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    console.error("Error fetching weather data:", error);
  }
}

// Display current weather and prepare forecast button
function displayWeather(currentData, forecastData) {
  forecastDataGlobal = forecastData; // store forecast globally
  const weatherInfo = document.getElementById("weatherInfo");

  const iconCode = currentData.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  const now = new Date();
  const formattedDate = now.toLocaleDateString();
  const formattedTime = now.toLocaleTimeString();

  let html = `
  <h2>${currentData.name}, ${currentData.sys.country}</h2>
  <img src="${iconUrl}" alt="${currentData.weather[0].description}">
  <p><strong>${currentData.weather[0].main}</strong></p>
  <h1>${currentData.main.temp}°C</h1>
  <p>Feels like ${currentData.main.feels_like}°C</p>

  <div class="stats">
    <div class="stat-box">
      <p>Humidity</p>
      <h3>${currentData.main.humidity}%</h3>
    </div>
    <div class="stat-box">
      <p>Wind Speed</p>
      <h3>${currentData.wind.speed} m/s</h3>
    </div>
    <div class="stat-box">
      <p>Pressure</p>
      <h3>${currentData.main.pressure} hPa</h3>
    </div>
    <div class="stat-box">
      <p>Visibility</p>
      <h3>${(currentData.visibility / 1000).toFixed(1)} km</h3>
    </div>
  </div>
`;


  weatherInfo.innerHTML = html;

  // Show forecast button
  const toggleBtn = document.getElementById("toggleForecast");
  toggleBtn.style.display = "block";
  toggleBtn.textContent = "Show 5-Day Forecast";

  // Remove old forecast if any
  const oldForecast = document.querySelector(".forecast-container");
  if (oldForecast) oldForecast.remove();
}

// Show forecast only on button click
function showForecast() {
  if (!forecastDataGlobal) return;

  const container = document.createElement("div");
  container.className = "forecast-container";

  const dailyForecasts = {};
  forecastDataGlobal.list.forEach(item => {
    const [date, time] = item.dt_txt.split(" ");
    if (time === "12:00:00") dailyForecasts[date] = item;
  });

  forecastDataGlobal.list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyForecasts[date]) dailyForecasts[date] = item;
  });

  const forecastDates = Object.keys(dailyForecasts).slice(0, 5);

  forecastDates.forEach(date => {
    const day = dailyForecasts[date];
    const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
    const description = day.weather[0].description;
    const temp = day.main.temp;

    const dateObj = new Date(date);
    const formattedDay = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const card = document.createElement("div");
    card.className = "forecast-day";
    card.innerHTML = `
      <p><strong>${formattedDay}</strong></p>
      <img src="${icon}" alt="${description}">
      <p>${description}</p>
      <p>Temp: ${temp} °C</p>
    `;
    container.appendChild(card);
  });

  document.getElementById("weatherInfo").appendChild(container);
  document.getElementById("toggleForecast").style.display = "none";
}

function saveToHistory(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  if (!history.includes(city)) {
    history.unshift(city); // add to front
    history = history.slice(0, 5); // keep only last 5
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
  renderHistory();
}

function renderHistory() {
  const historyList = document.getElementById("searchHistory");
  historyList.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.addEventListener("click", () => {
      document.getElementById("cityInput").value = city;
      getWeather();
    });
    historyList.appendChild(li);
  });
}

window.onload = renderHistory;

function clearHistory() {
  localStorage.removeItem("weatherHistory");
  renderHistory(); // Clear list from UI too
}
document.getElementById("clearHistory").addEventListener("click", clearHistory);




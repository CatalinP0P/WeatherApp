import './App.css';
import Axios from 'axios';
import {useState, useEffect, useRef} from 'react';
import search from "./Assets/search.svg";
import rainSVG from "./Assets/rain.svg";

import Sunny from "./Assets/Sunny.png";
import PartialSunny from "./Assets/Partial Sunny.png";
import Cloudy from "./Assets/Cloudy.png";
import Fog from "./Assets/Fog.png";
import Snow from "./Assets/Snow.png";
import Thunder from "./Assets/Thunder.png";
import Rain1 from "./Assets/Rain1.png";
import Rain2 from "./Assets/Rain2.png";

import sunset from "./Assets/sunset.svg"
import sunrise from "./Assets/sunrise.svg";

function App() {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Thursday", "Wednesday", "Friday", "Saturday"]
    const textBoxText = useRef();

    const [location, setLocation] = useState();
    const [currentWeather, setCurrentWeather] = useState();
    const [dailyWeather, setDailyWeather] = useState();
    const [todayWeather, setTodayWeather] = useState();

    const getTime = (date) =>
    {
      var hour = date.getHours();
      var minutes = date.getMinutes();

      var minuteString = minutes > 9 ? minutes : "0" + minutes;

      return `${hour}:${minuteString}`;
    }

    const degreesToDirection = (degrees) =>
    {
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const index = Math.round(degrees / 45) % 8;
    
      return directions[index];
    }

    const getWeatherCodeMeaning = (code) =>
    {
      if ( code == 0 )
        return "Sunny";
      if ( code <= 3  )
        return "Partial Sunny"
      if ( code <= 48)
        return "Fog";
      if ( code <= 55 )
        return "Rain";
      if ( code <= 64 )
        return "Rain";
      if ( code <= 65 )
        return "Heavy Rain";
      if ( code <= 75 ) 
        return "Snow";
      if ( code <= 82 )
        return "Heavy Rain";
      if ( code <= 86 )
        return "Snow";
      if ( code <= 99 )
        return "Thunderstorm";
    }

    const getImageFromWeatherCode = (code) =>
    {
      if ( code == 0 )
        return Sunny;
      if ( code <= 3  )
        return PartialSunny
      if ( code <= 48)
        return Fog;
      if ( code <= 55 )
        return Rain1;
      if ( code <= 64 )
        return Rain1;
      if ( code <= 65 )
        return Rain2;
      if ( code <= 75 ) 
        return Snow;
      if ( code <= 82 )
        return Rain2;
      if ( code <= 86 )
        return Snow;
      if ( code <= 99 )
        return Thunder;
    }

    const getWeather = async (location) =>
    {
      const {admin1, country_code ,name, latitude, longitude, timezone } = await getLatitudeAndLongitude(location);
      
      var response = await Axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=temperature_2m_max&daily=temperature_2m_min&daily=weathercode&current_weather=true&daily=windspeed_10m_max&daily=winddirection_10m_dominant&daily=sunset&daily=sunrise&daily=precipitation_probability_max&daily=uv_index_max&hourly=visibility&hourly=relativehumidity_2m&hourly=windspeed_10m&hourly=winddirection_10m&hourly=visibility&hourly=precipitation_probability&daily=rain_sum`);

      setCurrentWeather(response.data.current_weather);
      var weather = [];
      for ( var i=0; i<response.data.daily.time.length; i++ )
      {
        weather.push({temperature_2m_max: response.data.daily.temperature_2m_max[i], temperature_2m_min: response.data.daily.temperature_2m_min[i], time: response.data.daily.time[i], weathercode: response.data.daily.weathercode[i]});
      }
      setDailyWeather(weather);
      let weatherToday = {
        uv_index_max: response.data.daily.uv_index_max[0],
        windspeed_10m: response.data.daily.windspeed_10m_max[0],
        winddirection_10m: response.data.daily.winddirection_10m_dominant[0],
        relativehumidity_2m: 0,
        visibility: 0,
        rain_sum: response.data.daily.rain_sum[0],
        precipitation_probability: 0,
        sunrise: getTime(new Date(response.data.daily.sunrise[0])),
        sunset: getTime(new Date(response.data.daily.sunset[0])),
      }

      // Getting the real time values
      var index = 0;
      while ( new Date(response.data.hourly.time[index]) < new Date()  )
      {
        index++;

        weatherToday.precipitation_probability = response.data.hourly.precipitation_probability[index];
        weatherToday.visibility = response.data.hourly.visibility[index]/1000;
        weatherToday.windspeed_10m = response.data.hourly.windspeed_10m[index];
        weatherToday.winddirection_10m = response.data.hourly.winddirection_10m[index];
        weatherToday.relativehumidity_2m = response.data.hourly.relativehumidity_2m[index];
      }
      setTodayWeather(weatherToday);
    }

    const getLatitudeAndLongitude = async (location) =>
    {
      var response = await Axios.get("https://geocoding-api.open-meteo.com/v1/search?name=" + location)
      setLocation(response.data.results[0]);
      return response.data.results[0];
    }

    const askForLocation = () =>
    {
      if ( navigator.geolocation )
      {
        navigator.geolocation.getCurrentPosition((position) =>
        {
          const {latitude, longitude} = position.coords;
        });
      }
    }

    return (
      <div className='container'>
        <div className='card row' >
          <div className='cardLeft bg-light' >
            <div className='textBox' >
              <img src={search}
              onClick={() => {
                getWeather(textBoxText.current.value);
                textBoxText.current.value = "";
              }} ></img>
              <input placeholder='Search for a places..' 
              ref={textBoxText}
              onKeyDown={e =>
                {
                  if ( e.code == "Enter" )
                  {
                    getWeather(e.target.value);
                    e.target.value = "";
                  }
                  
                }} ></input>
            </div>

            <h2> {location?.name}, <span className='color-muted' >{location?.admin1}</span> </h2>

            <img src={getImageFromWeatherCode(currentWeather?.weathercode)} id='realTimeStatus' ></img>
            <label id='realTimeTemp' >{parseInt(currentWeather?.temperature)} <span>°C</span></label>
            <label id='time' > <span>{daysOfWeek[new Date().getDay()]}</span>, {getTime(new Date())} </label>

            <label className='info' > {getWeatherCodeMeaning(currentWeather?.weathercode)} </label>
            <label className='info' > <img className='icon' src={rainSVG} ></img> {todayWeather?.precipitation_probability}% </label>

          </div>

          <div className='cardRight bg-muted' >
            <div className='header'>
              <div className='headerItem' >
                <label className='color-muted' > Today </label>
                <label className='selected' > Week </label>
              </div>

              <div className='headerItem' >
                <button className='selected' >°C</button>
                <button>°F</button>
              </div>
            </div>


            <div className='row mt-3' >
              {dailyWeather?.map( daily =>
              {
                return (
                  <div className='infoCard' key={daily.time} >
                    <label> {daysOfWeek[new Date(daily.time).getDay()].substring(0,3)} </label>
                    <img src={getImageFromWeatherCode(daily.weathercode)} ></img>
                    <label> {parseInt(daily.temperature_2m_max)}°C <span className='color-muted' > {parseInt(daily.temperature_2m_min)}°C </span> </label>
                  </div>
                )  
              })}

            </div>
              

            <h3 className='mt-3' > Today's Highlights </h3>
            <div className='row g-1 stretch' >
              <div className='infoCard bigImage' > 
                <h4 className='color-muted' > UV Index </h4>
                <h1 className='mt-4' style={{margin: "50px 10px"}} > {todayWeather?.uv_index_max} </h1>
              </div>

              <div className='infoCard bigImage' > 
                <h4 className='color-muted' > Wind Speed </h4>
                <h1> {todayWeather?.windspeed_10m} <span>km/h</span></h1>
                <p className='condition' > {degreesToDirection(todayWeather?.winddirection_10m)}° </p>
              </div>

              <div className='infoCard bigImage' > 
                <h4 className='color-muted' > Sunrise & Sunset</h4>
                <div className='sunInfo mt-3' >
                  <img src={sunrise} ></img>
                  <label> {todayWeather?.sunrise} </label>
                </div>
                <div className='sunInfo' >
                  <img src={sunset} ></img>
                  <label> {todayWeather?.sunset} </label>
                </div>
              </div>
            </div>

            <div className='row g-1 stretch mt-2' >
              <div className='infoCard bigImage' > 
                <h4 className='color-muted' > Humidity </h4>
                <h1> {todayWeather?.relativehumidity_2m} <span className='degrees' >%</span> </h1>
                <p  className='condition' > Normal </p>
              </div>

              <div className='infoCard bigImage' > 
                <h4 className='color-muted' > Visibility </h4>
                <h1> {todayWeather?.visibility} <span className='degrees' >km</span> </h1>
                <p  className='condition' > Average </p>
              </div>

              <div className='infoCard bigImage' > 
                <h4 className='color-muted' > Rain Sum </h4>
                <h1> {todayWeather?.rain_sum} </h1>
                <p  className='condition' > Unhealty </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
}

export default App;

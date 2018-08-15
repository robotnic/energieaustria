request = require('request');


var url = 'https://transparency.entsoe.eu/generation/r2/actualGenerationPerProductionType/export?name=&defaultValue=true&viewType=TABLE&areaType=BZN&atch=false&datepicker-day-offset-select-dv-date-from_input=D&dateTime.dateTime=31.05.2018+00%3A00%7CCET%7CDAYTIMERANGE&dateTime.endDateTime=31.05.2018+00%3A00%7CCET%7CDAYTIMERANGE&area.values=CTY%7C10YAT-APG------L!BZN%7C10Y1001A1001A63L&productionType.values=B01&productionType.values=B02&productionType.values=B03&productionType.values=B04&productionType.values=B05&productionType.values=B06&productionType.values=B07&productionType.values=B08&productionType.values=B09&productionType.values=B10&productionType.values=B11&productionType.values=B12&productionType.values=B13&productionType.values=B14&productionType.values=B20&productionType.values=B15&productionType.values=B16&productionType.values=B17&productionType.values=B18&productionType.values=B19&dateTime.timezone=CET_CEST&dateTime.timezone_input=CET+(UTC%2B1)+%2F+CEST+(UTC%2B2)&dataItem=AGGREGATED_GENERATION_PER_TYPE&timeRange=DEFAULT&exportType=XML'

request(url, function(error, response, body){
});

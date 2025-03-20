import axios from 'axios';


export const fetchStopTimes = async (stopCode) => {
    const response = await axios.get(`https://open.tan.fr/ewp/tempsattente.json/${stopCode}`);
    return response.data;
};

export const fetchStops = async () => {
    const baseUrl = 'https://open.tan.fr/ewp/arrets.json';
    const stops = [];

    try {
        const response = await axios.get(baseUrl);

        response.data.forEach(stop => {
            stops.push({ codeLieu: stop.codeLieu, libelle: stop.libelle, ligne: stop.ligne });
        });

        return stops;
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts :", error);
        return [];
    }
};


export const fetchClosestStops = async (lat, long) => {
    const baseUrl = `https://open.tan.fr/ewp/arrets.json/${lat}/${long}`;

    try {
        const response = await axios.get(baseUrl);
        console.log(lat, long)
        return response.data.map(stop => stop.libelle);
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts les plus proches :", error);
        return [];
    }
};

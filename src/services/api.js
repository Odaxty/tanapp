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
            stops.push({ codeLieu: stop.codeLieu, libelle: stop.libelle });
        });

        return stops;
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts :", error);
        return [];
    }
};


export const fetchDisruptions = async () => {
    const baseUrl = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_info-trafic-tan-temps-reel/records?limit=100';

    try {
        const response = await axios.get(baseUrl);

        const records = response.data.results || [];

        const affectedLines = new Set();

        records.forEach(record => {
            try {
                const tronconsArray = record.troncons.split(';');

                tronconsArray.forEach(troncon => {
                    const lineNumber = troncon.split('/')[0].replace('[', '');
                    if (lineNumber) {
                        affectedLines.add(lineNumber);
                    }
                });
            } catch (error) {
                console.error('Erreur de parsing des tronçons:', error);
            }
        });

        console.log('Lignes concernées par une info trafic:', Array.from(affectedLines));
        return Array.from(affectedLines);
    } catch (error) {
        console.error('Erreur lors de la récupération des perturbations:', error);
        return [];
    }
};

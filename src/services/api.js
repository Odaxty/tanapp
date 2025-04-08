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


export const fetchDisruptions = async () => {
    const baseUrl = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_info-trafic-tan-temps-reel/records?limit=100';

    try {
        const response = await axios.get(baseUrl);

        const records = response.data.results || [];

        const affectedLinesDetails = {};

        records.forEach(record => {
            try {
                const tronconsArray = record.troncons.split(';');

                tronconsArray.forEach(troncon => {
                    const lineNumber = troncon.split('/')[0].replace('[', '').trim();
                    if (lineNumber) {
                        if (!affectedLinesDetails[lineNumber]) {
                            affectedLinesDetails[lineNumber] = {
                                intitule: record.intitule,
                                resume: record.resume,
                                date_debut: record.date_debut,  // Ajout de la date de début
                                date_fin: record.date_fin,  // Ajout de la date de fin
                                heure_debut: record.heure_debut,
                                heure_fin: record.heure_fin
                            };
                        }
                    }
                });
            } catch (error) {
                console.error('Erreur de parsing gides tronçons:', error);
            }
        });

        const affectedLinesArray = Object.keys(affectedLinesDetails).map(lineNumber => ({
            lineNumber,
            details: affectedLinesDetails[lineNumber]
        }));

        console.log('Lignes concernées par une info trafic:', affectedLinesArray);
        return affectedLinesArray;
    } catch (error) {
        console.error('Erreur lors de la récupération des perturbations:', error);
        return [];
    }
};



export const fetchClosestStops = async (lat, long) => {
    const baseUrl = `https://open.tan.fr/ewp/arrets.json/${lat}/${long}`;

    try {
        const response = await axios.get(baseUrl);
        console.log(lat, long)
        console.log(response.data.map(stop => stop.libelle))
        console.log(
            response.data.map(stop => ({
            libelle: stop.libelle,
            distance: stop.distance
        }))
        )
        return response.data.map(stop => ({
            libelle: stop.libelle,
            distance: stop.distance
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts les plus proches :", error);
        return [];
    }
};

export const fetchHoraires = async (stopCode, ligne, sens) => {
    try {
        const stopTimes = await fetchStopTimes(stopCode);

        const matchingStop = stopTimes.find(item => item.ligne.numLigne === ligne && item.sens === sens);


        if (matchingStop) {
            const code = matchingStop.arret.codeArret;
            const baseUrl = `https://open.tan.fr/ewp/horairesarret.json/${code}/${ligne}/${sens}`;
            const horairesResponse = await axios.get(baseUrl);
            return horairesResponse.data;
        } else {
            console.error('Aucun arrêt correspondant trouvé.');
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires:', error);
        return null;
    }
};

import { useEffect, useRef } from "react";

import Map from "ol/Map";
import View from "ol/View";

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";

import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import Overlay from "ol/Overlay";

import { fromLonLat, toLonLat } from "ol/proj";

import "ol/ol.css";


interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}


interface Props {
    locations: Location[];
    onMapClick?: (lat: number, lon: number) => void;
}


function MapView({
    locations,
    onMapClick
}: Props) {

    const mapElement =
        useRef<HTMLDivElement | null>(null);

    const popupElement =
        useRef<HTMLDivElement | null>(null);


    const mapRef =
        useRef<Map | null>(null);

    const vectorSourceRef =
        useRef<VectorSource | null>(null);



    // Создание карты
    useEffect(() => {

        if (!mapElement.current)
            return;


        const vectorSource =
            new VectorSource();


        vectorSourceRef.current =
            vectorSource;


        const markerLayer =
            new VectorLayer({

                source: vectorSource

            });


        const map =
            new Map({

                target: mapElement.current,

                layers: [

                    new TileLayer({

                        source: new OSM()

                    }),

                    markerLayer

                ],

                view: new View({

                    center: fromLonLat([
                        74.5698,
                        42.8746
                    ]),

                    zoom: 13

                })

            });


        mapRef.current = map;



        const popup =
            new Overlay({

                element:
                    popupElement.current!,

                positioning:
                    "bottom-center",

                offset:
                    [0, -10]

            });


        map.addOverlay(popup);



        map.on(
            "click",
            (event) => {


                const feature =
                    map.forEachFeatureAtPixel(
                        event.pixel,
                        feature => feature
                    );


                // Нажали на существующую точку
                if (feature) {

                    popup.setPosition(
                        event.coordinate
                    );


                    popupElement.current!.innerHTML = `

                        <b>
                            ${feature.get("name")}
                        </b>

                        <br/>

                        Координаты:

                        <br/>

                        ${feature.get("latitude")},
                        ${feature.get("longitude")}

                    `;

                    return;
                }



                // Нажали на пустое место карты
                popup.setPosition(undefined);


                if (onMapClick) {

                    const [
                        longitude,
                        latitude
                    ] =
                        toLonLat(
                            event.coordinate
                        );


                    onMapClick(
                        latitude,
                        longitude
                    );

                }

            }
        );



        return () => {

            map.setTarget(undefined);

            mapRef.current = null;

        };


    }, [onMapClick]);




    // Обновление маркеров
    useEffect(() => {

        const source =
            vectorSourceRef.current;


        if (!source)
            return;


        source.clear();



        locations.forEach(location => {


            const marker =
                new Feature({

                    geometry:
                        new Point(

                            fromLonLat([

                                location.longitude,

                                location.latitude

                            ])

                        ),


                    name:
                        location.name,


                    latitude:
                        location.latitude,


                    longitude:
                        location.longitude

                });



            source.addFeature(marker);


        });


    }, [locations]);




    return (

        <>

            <div

                ref={mapElement}

                style={{
                    height: "600px",
                    width: "100%"
                }}

            />


            <div

                ref={popupElement}

                style={{
                    background: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.3)"
                }}

            />

        </>

    );

}


export default MapView;
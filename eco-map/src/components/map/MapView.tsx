import { useEffect, useRef } from "react";

import Map from "ol/Map";
import View from "ol/View";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import Overlay from "ol/Overlay";

import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

import { fromLonLat, toLonLat } from "ol/proj";

import { apply } from "ol-mapbox-style";

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

    // Элемент, в котором находится карта
    const mapElement =
        useRef<HTMLDivElement | null>(null);


    // Элемент popup
    const popupElement =
        useRef<HTMLDivElement | null>(null);


    // Экземпляр OpenLayers Map
    const mapRef =
        useRef<Map | null>(null);


    // Источник маркеров
    const vectorSourceRef =
        useRef<VectorSource | null>(null);


    // Храним актуальный onMapClick,
    // чтобы карта не пересоздавалась
    // при каждом изменении состояния
    const onMapClickRef =
        useRef<Props["onMapClick"]>(
            onMapClick
        );


    // Обновляем актуальный callback
    useEffect(() => {

        onMapClickRef.current =
            onMapClick;

    }, [onMapClick]);


    // =====================================================
    // СОЗДАНИЕ КАРТЫ
    // =====================================================

    useEffect(() => {

        if (!mapElement.current)
            return;


        let map: Map | null = null;


        // =================================================
        // ИСТОЧНИК МАРКЕРОВ
        // =================================================

        const vectorSource =
            new VectorSource();


        vectorSourceRef.current =
            vectorSource;


        // =================================================
        // СТИЛЬ МАРКЕРОВ
        // =================================================

        const markerStyle =
            new Style({

                image:
                    new CircleStyle({

                        radius: 7,

                        fill:
                            new Fill({

                                color:
                                    "#22c55e"

                            }),

                        stroke:
                            new Stroke({

                                color:
                                    "#ffffff",

                                width:
                                    2

                            })

                    })

            });


        // =================================================
        // СЛОЙ МАРКЕРОВ
        // =================================================

        const markerLayer =
            new VectorLayer({

                source:
                    vectorSource,

                style:
                    markerStyle

            });


        // =================================================
        // СОЗДАНИЕ MAP
        // =================================================

        const mapInstance =
            new Map({

                target:
                    mapElement.current,

                // Пока без слоёв.
                // OpenFreeMap добавит свои слои
                // через apply().
                layers: [],

                view:
                    new View({

                        center:
                            fromLonLat([

                                74.5698,
                                42.8746

                            ]),

                        zoom:
                            13

                    })

            });


        map =
            mapInstance;


        mapRef.current =
            mapInstance;


        // =================================================
        // OPENFREEMAP VECTOR TILES
        // =================================================

        apply(
            mapInstance,
            "https://tiles.openfreemap.org/styles/liberty"
        ).then(() => {

            // ВАЖНО:
            // добавляем наши маркеры ПОСЛЕ
            // базовых слоёв OpenFreeMap,
            // чтобы они находились сверху.

            mapInstance.addLayer(
                markerLayer
            );

        });


        // =================================================
        // POPUP
        // =================================================

        const popup =
            new Overlay({

                element:
                    popupElement.current!,

                positioning:
                    "bottom-center",

                offset:
                    [0, -10]

            });


        mapInstance.addOverlay(
            popup
        );


        // =================================================
        // КЛИК ПО КАРТЕ
        // =================================================

        mapInstance.on(
            "click",
            event => {

                // Проверяем, есть ли
                // маркер под курсором.

                const feature =
                    mapInstance.forEachFeatureAtPixel(
                        event.pixel,
                        feature =>
                            feature
                    );


                // =================================================
                // КЛИК ПО МАРКЕРУ
                // =================================================

                if (feature) {

                    popup.setPosition(
                        event.coordinate
                    );


                    popupElement.current!
                        .innerHTML = `

    <b>
                                ${ feature.get("name") }
                            </b >

    <br />

Координаты:

<br />

                            ${ feature.get("latitude") },
                            ${ feature.get("longitude") }

`;


                    return;

                }


                // =================================================
                // КЛИК ПО ПУСТОМУ МЕСТУ
                // =================================================

                popup.setPosition(
                    undefined
                );


                if (
                    onMapClickRef.current
                ) {

                    const [
                        longitude,
                        latitude
                    ] =
                        toLonLat(
                            event.coordinate
                        );


                    onMapClickRef.current(
                        latitude,
                        longitude
                    );

                }

            }
        );


        // =================================================
        // ОЧИСТКА
        // =================================================

        return () => {

            if (map) {

                map.setTarget(
                    undefined
                );

            }


            mapRef.current =
                null;


            vectorSourceRef.current =
                null;

        };


    }, []);


    // =====================================================
    // ОБНОВЛЕНИЕ МАРКЕРОВ
    // =====================================================

    useEffect(() => {

        const source =
            vectorSourceRef.current;


        if (!source)
            return;


        // Удаляем старые маркеры
        source.clear();


        // Добавляем актуальные маркеры
        locations.forEach(
            location => {

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


                source.addFeature(
                    marker
                );

            }
        );


    }, [locations]);


    // =====================================================
    // JSX
    // =====================================================

    return (

        <>

            <div
                ref={mapElement}
                style={{
                    width: "100%",
                    height: "600px"
                }}
            />


            <div
                ref={popupElement}
                style={{
                    background:
                        "white",

                    padding:
                        "10px",

                    borderRadius:
                        "5px",

                    boxShadow:
                        "0 2px 8px rgba(0, 0, 0, 0.3)"
                }}
            />

        </>

    );

}


export default MapView;

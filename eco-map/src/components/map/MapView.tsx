import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

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


// =====================================================
// ТИПЫ
// =====================================================

interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}

interface Props {
    locations: Location[];

    // Клик по карте.
    // Передаём координаты в формате:
    // latitude, longitude
    onMapClick?: (lat: number, lon: number) => void;

    // Клик по существующей локации.
    onLocationClick?: (location: Location) => void;

    // ID выбранной локации.
    selectedLocationId?: number | null;

    // Содержимое popup.
    popupContent?: React.ReactNode;

    // Тема карты: "light" | "dark".
    // Переключает стиль тайлов OpenFreeMap.
    theme?: "light" | "dark";
}


// =====================================================
// СТИЛИ КАРТЫ ПО ТЕМЕ
// =====================================================

const MAP_STYLE_BY_THEME: Record<"light" | "dark", string> = {
    light: "https://tiles.openfreemap.org/styles/liberty",
    dark: "https://tiles.openfreemap.org/styles/dark"
};


// =====================================================
// СТИЛЬ МАРКЕРА
// =====================================================

function markerStyleFor(isSelected: boolean) {
    return new Style({
        image: new CircleStyle({
            radius: isSelected ? 9 : 7,

            fill: new Fill({
                color: isSelected
                    ? "#2563eb"
                    : "#22c55e"
            }),

            stroke: new Stroke({
                color: "#ffffff",
                width: 2
            })
        })
    });
}


// =====================================================
// MAP VIEW
// =====================================================

function MapView({
    locations,
    onMapClick,
    onLocationClick,
    selectedLocationId = null,
    popupContent,
    theme = "light"
}: Props) {

    // =================================================
    // DOM
    // =================================================

    const mapElement =
        useRef<HTMLDivElement | null>(null);

    const popupElementRef =
        useRef<HTMLDivElement | null>(null);

    const [popupNode, setPopupNode] =
        useState<HTMLDivElement | null>(null);


    const setPopupRef = useCallback(
        (node: HTMLDivElement | null) => {
            popupElementRef.current = node;
            setPopupNode(node);
        },
        []
    );


    // =================================================
    // OPENLAYERS REFERENCES
    // =================================================

    const mapRef =
        useRef<Map | null>(null);

    const previousZoomRef =
        useRef<number | undefined>(undefined);

    const previousCenterRef =
        useRef<number[] | undefined>(undefined);

    const overlayRef =
        useRef<Overlay | null>(null);

    const vectorSourceRef =
        useRef<VectorSource | null>(null);


    // =================================================
    // АКТУАЛЬНЫЕ CALLBACKS
    // =================================================

    const onMapClickRef =
        useRef<Props["onMapClick"]>(onMapClick);

    const onLocationClickRef =
        useRef<Props["onLocationClick"]>(
            onLocationClick
        );

    const selectedLocationIdRef =
        useRef<number | null>(
            selectedLocationId
        );


    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);


    useEffect(() => {
        onLocationClickRef.current =
            onLocationClick;
    }, [onLocationClick]);


    useEffect(() => {
        selectedLocationIdRef.current =
            selectedLocationId;
    }, [selectedLocationId]);


    // =====================================================
    // СОЗДАНИЕ КАРТЫ
    // =====================================================

    useEffect(() => {
        if (
            !mapElement.current ||
            !popupElementRef.current
        ) {
            return;
        }


        // =================================================
        // ИСТОЧНИК НАШИХ МАРКЕРОВ
        // =================================================

        const vectorSource =
            new VectorSource();

        vectorSourceRef.current =
            vectorSource;


        // =================================================
        // СЛОЙ НАШИХ МАРКЕРОВ
        // =================================================

        const markerLayer =
            new VectorLayer({
                source: vectorSource,

                style: feature => {

                    const isSelected =
                        feature.get("id") ===
                        selectedLocationIdRef.current;

                    return markerStyleFor(
                        isSelected
                    );
                }
            });


        // =================================================
        // СОЗДАНИЕ КАРТЫ
        // =================================================
        //
        // Если карта уже существовала (например, при
        // переключении темы), сохраняем текущий центр
        // и зум, чтобы не "прыгать" по карте.
        // =================================================

        //const previousView =
        //    mapRef.current?.getView();

        //const initialCenter =
        //    previousView?.getCenter() ??
        //    fromLonLat([74.5698, 42.8746]);

        //const initialZoom =
        //    previousView?.getZoom() ?? 13;


        //const previousView =
        //    mapRef.current?.getView();

        //const initialCenter =
        //    previousView?.getCenter() ??
        //    fromLonLat([74.5698, 42.8746]);

        //const initialZoom =
        //    previousZoomRef.current ?? 13;

        const initialCenter =
            previousCenterRef.current ??
            fromLonLat([74.5698, 42.8746]);

        const initialZoom =
            previousZoomRef.current ?? 13;

        const mapInstance =
            new Map({

                target:
                    mapElement.current,

                // Базовые слои OpenFreeMap
                // добавятся ниже через apply().
                layers: [],

                view:
                    new View({
                        center: initialCenter,
                        zoom: initialZoom
                    })
            });


        mapRef.current =
            mapInstance;


        // =================================================
        // OPENFREEMAP
        // =================================================

        apply(
            mapInstance,
            MAP_STYLE_BY_THEME[theme]
        )
            .then(() => {

                // Наши маркеры добавляем поверх
                // базовой карты.
                mapInstance.addLayer(
                    markerLayer
                );

            })
            .catch(error => {
                console.error(
                    "Не удалось загрузить OpenFreeMap:",
                    error
                );
            });


        // =================================================
        // POPUP
        // =================================================

        const popup =
            new Overlay({

                element:
                    popupElementRef.current,

                positioning:
                    "bottom-center",

                offset:
                    [0, -12],

                autoPan: {
                    animation: {
                        duration: 200
                    }
                }
            });


        mapInstance.addOverlay(
            popup
        );

        overlayRef.current =
            popup;


        // =================================================
        // ПОКАЗ POPUP ДЛЯ УЖЕ ВЫБРАННОЙ ЛОКАЦИИ
        // =================================================

        if (
            selectedLocationIdRef.current !== null
        ) {

            const location =
                locations.find(
                    location =>
                        location.id ===
                        selectedLocationIdRef.current
                );


            if (location) {

                popup.setPosition(
                    fromLonLat([
                        location.longitude,
                        location.latitude
                    ])
                );
            }
        }


        // =================================================
        // КЛИК ПО КАРТЕ
        // =================================================

        mapInstance.on(
            "click",
            event => {

                // -------------------------------------------------
                // Ищем Feature под курсором.
                //
                // ВАЖНО:
                // OpenFreeMap использует vector tiles.
                // Поэтому здесь могут находиться:
                //
                // - дороги
                // - здания
                // - границы
                // - другие объекты карты
                //
                // Поэтому найденный Feature НЕ означает,
                // что это наша Location.
                // -------------------------------------------------

                const feature =
                    mapInstance.forEachFeatureAtPixel(
                        event.pixel,
                        feature => feature
                    );


                // =================================================
                // КЛИК ПО НАШЕМУ МАРКЕРУ
                // =================================================

                if (
                    feature &&
                    feature.get("type") ===
                        "location"
                ) {

                    const id =
                        feature.get("id");

                    const name =
                        feature.get("name");

                    const latitude =
                        feature.get("latitude");

                    const longitude =
                        feature.get("longitude");


                    // Дополнительная защита.
                    //
                    // Даже если структура Feature когда-нибудь
                    // изменится, мы не отправим undefined
                    // в Home.tsx.

                    if (
                        typeof id !== "number" ||
                        typeof name !== "string" ||
                        typeof latitude !== "number" ||
                        typeof longitude !== "number"
                    ) {

                        console.warn(
                            "Некорректный маркер Location:",
                            feature
                        );

                        return;
                    }


                    if (
                        onLocationClickRef.current
                    ) {

                        onLocationClickRef.current({
                            id,
                            name,
                            latitude,
                            longitude
                        });
                    }


                    return;
                }


                // =================================================
                // КЛИК ПО ЛЮБОМУ ДРУГОМУ МЕСТУ КАРТЫ
                // =================================================
                //
                // Сюда попадают:
                //
                // - пустое место
                // - дорога
                // - дом
                // - парк
                // - другой объект OpenFreeMap
                //
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
        // CLEANUP
        // =================================================

        //return () => {

        //    mapInstance.setTarget(
        //        undefined
        //    );

        //    mapRef.current =
        //        null;

        //    overlayRef.current =
        //        null;

        //    vectorSourceRef.current =
        //        null;
        //};

        //return () => {
        //    previousZoomRef.current =
        //        mapInstance.getView().getZoom();

        //    mapInstance.setTarget(
        //        undefined
        //    );

        //    mapRef.current =
        //        null;

        //    overlayRef.current =
        //        null;

        //    vectorSourceRef.current =
        //        null;
        //};

        return () => {
            previousZoomRef.current =
                mapInstance.getView().getZoom();

            previousCenterRef.current =
                mapInstance.getView().getCenter();

            mapInstance.setTarget(
                undefined
            );

            mapRef.current = null;

            overlayRef.current = null;

            vectorSourceRef.current = null;
        };


        // Карта создаётся только после появления
        // popup DOM-узла, а также пересоздаётся
        // при смене темы (свои тайлы OpenFreeMap).
        //
        // eslint-disable-next-line
        // react-hooks/exhaustive-deps

    }, [popupNode, theme]);


    // =====================================================
    // ОБНОВЛЕНИЕ МАРКЕРОВ
    // =====================================================

    useEffect(() => {

        const source =
            vectorSourceRef.current;


        if (!source) {
            return;
        }


        // Удаляем старые маркеры.
        source.clear();


        // Добавляем актуальные маркеры.
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

                        // =================================================
                        // КРИТИЧЕСКИ ВАЖНО
                        // =================================================
                        //
                        // Это позволяет отличить наши маркеры
                        // от Feature OpenFreeMap.
                        //
                        type: "location",

                        id:
                            location.id,

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


    }, [locations, theme]);


    // =====================================================
    // ПОЗИЦИОНИРОВАНИЕ POPUP
    // =====================================================

    useEffect(() => {

        const overlay =
            overlayRef.current;


        if (!overlay) {
            return;
        }


        // Нет выбранной локации.
        if (
            selectedLocationId === null ||
            selectedLocationId === undefined
        ) {

            overlay.setPosition(
                undefined
            );

            return;
        }


        // Ищем выбранную локацию.
        const location =
            locations.find(
                location =>
                    location.id ===
                    selectedLocationId
            );


        // Локация не найдена.
        if (!location) {

            overlay.setPosition(
                undefined
            );

            return;
        }


        // Ставим popup над маркером.
        overlay.setPosition(
            fromLonLat([
                location.longitude,
                location.latitude
            ])
        );


        // Обновляем стили маркеров.
        vectorSourceRef.current
            ?.getFeatures()
            .forEach(
                feature =>
                    feature.changed()
            );


    }, [
        selectedLocationId,
        locations
    ]);


    // =====================================================
    // JSX
    // =====================================================

    return (
        <>
            <div
                //ref={mapElement}
                //style={{
                //    width: "100%",
                //    height: "600px"
                //}}
                ref={mapElement}
                className="map-element"
            />

            <div
                ref={setPopupRef}
                className="map-popup"
            >
                {
                    popupNode &&
                    popupContent
                        ? createPortal(
                            popupContent,
                            popupNode
                        )
                        : null
                }
            </div>
        </>
    );
}


export default MapView;

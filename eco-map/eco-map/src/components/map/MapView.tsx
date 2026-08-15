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

interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}

interface Props {
    locations: Location[];
    onMapClick?: (lat: number, lon: number) => void;
    onLocationClick?: (location: Location) => void;
    selectedLocationId?: number | null;
    popupContent?: React.ReactNode;
}

function markerStyleFor(isSelected: boolean) {
    return new Style({
        image: new CircleStyle({
            radius: isSelected ? 9 : 7,
            fill: new Fill({
                color: isSelected ? "#2563eb" : "#22c55e"
            }),
            stroke: new Stroke({
                color: "#ffffff",
                width: 2
            })
        })
    });
}

function MapView({
    locations,
    onMapClick,
    onLocationClick,
    selectedLocationId = null,
    popupContent
}: Props) {

    // =====================================================
    // REFS
    // =====================================================

    const mapElement =
        useRef<HTMLDivElement | null>(null);

    const popupElementRef =
        useRef<HTMLDivElement | null>(null);

    const mapRef =
        useRef<Map | null>(null);

    const overlayRef =
        useRef<Overlay | null>(null);

    const vectorSourceRef =
        useRef<VectorSource | null>(null);

    const onMapClickRef =
        useRef<Props["onMapClick"]>(onMapClick);

    const onLocationClickRef =
        useRef<Props["onLocationClick"]>(onLocationClick);

    const selectedLocationIdRef =
        useRef<number | null>(selectedLocationId);

    // =====================================================
    // POPUP DOM
    // =====================================================

    const [popupNode, setPopupNode] =
        useState<HTMLDivElement | null>(null);

    const setPopupRef = useCallback(
        (node: HTMLDivElement | null) => {
            popupElementRef.current = node;
            setPopupNode(node);
        },
        []
    );

    // =====================================================
    // АКТУАЛИЗАЦИЯ CALLBACKS
    // =====================================================

    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    useEffect(() => {
        onLocationClickRef.current = onLocationClick;
    }, [onLocationClick]);

    useEffect(() => {
        selectedLocationIdRef.current = selectedLocationId;
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

                style: (feature) => {
                    return markerStyleFor(
                        feature.get("id") ===
                        selectedLocationIdRef.current
                    );
                }
            });

        // =================================================
        // MAP
        // =================================================

        const mapInstance =
            new Map({
                target: mapElement.current,

                layers: [],

                view:
                    new View({
                        center:
                            fromLonLat([
                                74.5698,
                                42.8746
                            ]),

                        zoom: 13
                    })
            });

        mapRef.current =
            mapInstance;

        // =================================================
        // OPENFREEMAP
        // =================================================

        apply(
            mapInstance,
            "https://tiles.openfreemap.org/styles/liberty"
        )
            .then(() => {

                if (
                    mapRef.current !== mapInstance
                ) {
                    return;
                }

                mapInstance.addLayer(
                    markerLayer
                );

            })
            .catch((error) => {
                console.error(
                    "Ошибка загрузки карты:",
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
        // КЛИК ПО КАРТЕ
        // =================================================

        mapInstance.on(
            "click",
            (event) => {

                // -------------------------------------------------
                // Ищем ТОЛЬКО наши маркеры.
                //
                // Не используем forEachFeatureAtPixel(),
                // потому что OpenFreeMap тоже содержит features.
                // -------------------------------------------------

                const features =
                    vectorSource.getFeatures();

                let clickedLocation:
                    Location | null = null;

                for (
                    const marker of features
                ) {

                    const geometry =
                        marker.getGeometry();

                    if (
                        !(geometry instanceof Point)
                    ) {
                        continue;
                    }

                    const markerPixel =
                        mapInstance.getPixelFromCoordinate(
                            geometry.getCoordinates()
                        );

                    const dx =
                        markerPixel[0] -
                        event.pixel[0];

                    const dy =
                        markerPixel[1] -
                        event.pixel[1];

                    const distance =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );

                    if (distance <= 15) {

                        const type =
                            marker.get("type");

                        if (
                            type !== "location"
                        ) {
                            continue;
                        }

                        const id =
                            marker.get("id");

                        const name =
                            marker.get("name");

                        const latitude =
                            marker.get("latitude");

                        const longitude =
                            marker.get("longitude");

                        // Дополнительная защита.
                        // Никаких undefined в Location.
                        if (
                            typeof id !== "number" ||
                            typeof name !== "string" ||
                            typeof latitude !== "number" ||
                            typeof longitude !== "number"
                        ) {
                            console.error(
                                "Некорректный маркер:",
                                marker.getProperties()
                            );

                            continue;
                        }

                        clickedLocation = {
                            id,
                            name,
                            latitude,
                            longitude
                        };

                        break;
                    }
                }

                // =================================================
                // КЛИК ПО НАШЕЙ ЛОКАЦИИ
                // =================================================

                if (
                    clickedLocation !== null
                ) {

                    onLocationClickRef.current?.(
                        clickedLocation
                    );

                    return;
                }

                // =================================================
                // КЛИК ПО ПУСТОМУ МЕСТУ
                // =================================================

                popup.setPosition(
                    undefined
                );

                const [
                    longitude,
                    latitude
                ] =
                    toLonLat(
                        event.coordinate
                    );

                onMapClickRef.current?.(
                    latitude,
                    longitude
                );
            }
        );

        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            mapInstance.setTarget(
                undefined
            );

            mapRef.current =
                null;

            overlayRef.current =
                null;

            vectorSourceRef.current =
                null;
        };

    }, [popupNode]);

    // =====================================================
    // ОБНОВЛЕНИЕ МАРКЕРОВ
    // =====================================================

    useEffect(() => {

        const source =
            vectorSourceRef.current;

        if (!source) {
            return;
        }

        source.clear();

        locations.forEach(
            (location) => {

                const marker =
                    new Feature({

                        geometry:
                            new Point(
                                fromLonLat([
                                    location.longitude,
                                    location.latitude
                                ])
                            ),

                        type:
                            "location",

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

    }, [locations]);

    // =====================================================
    // ПОЗИЦИЯ POPUP
    // =====================================================

    useEffect(() => {

        const overlay =
            overlayRef.current;

        if (!overlay) {
            return;
        }

        if (
            selectedLocationId === null ||
            selectedLocationId === undefined
        ) {

            overlay.setPosition(
                undefined
            );

            return;
        }

        const location =
            locations.find(
                (item) =>
                    item.id ===
                    selectedLocationId
            );

        if (!location) {

            overlay.setPosition(
                undefined
            );

            return;
        }

        overlay.setPosition(
            fromLonLat([
                location.longitude,
                location.latitude
            ])
        );

        // Обновляем стиль маркеров
        vectorSourceRef.current
            ?.getFeatures()
            .forEach(
                (feature) => {
                    feature.changed();
                }
            );

    }, [
        selectedLocationId,
        locations
    ]);

    // =====================================================
    // JSX
    // =====================================================

    return (
        //<>
        //    <div
        //        ref={mapElement}
        //        style={{
        //            //width: "100%",
        //            //height: "600px"
        //            width: "100%",
        //            height: "100%"
        //        }}
        //    />

        //    <div
        //        ref={setPopupRef}
        //        className="map-popup"
        //    >
        //        {popupNode && popupContent
        //            ? createPortal(
        //                popupContent,
        //                popupNode
        //            )
        //            : null}
        //    </div>
        //</>
        <>
        <div className="map-container">
            <div
                ref={mapElement}
                className="map-element"
            />

            <div
                ref={setPopupRef}
                className="map-popup"
            >
                {popupNode && popupContent
                    ? createPortal(
                        popupContent,
                        popupNode
                    )
                    : null}
            </div>
            </div>
        </>
    );
}

export default MapView;
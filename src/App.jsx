import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import "./index.css";
import "./PlayButton.css"
import musicUrl from "../public/wedding-music.mp3";

import FormResonse from "./FormResponse.jsx";

function roundEven(n) {
    let v = Math.round(n);
    if (v % 2 !== 0) v += 1;
    return v;
}

export default function App() {
    const [formSubmitted, setFormSubmitted] = useState(false);

    const [playing, setPlaying] = useState(false);
    const [isTriggered, setIsTriggered] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    const audioRef = useRef(null);
    const arrowRef = useRef(null);
    const inviteRef = useRef(null);
    const playPromiseRef = useRef(null);

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;

        console.log("AUDIO initial src (resolved):", a.src);

        const onError = (ev) => {
            console.error("Audio error event:", audioRef.current && audioRef.current.error, ev);
        };
        const onCanPlay = () => {
            console.log("Audio canplay event, src:", a.currentSrc || a.src);
        };
        a.addEventListener("error", onError);
        a.addEventListener("canplay", onCanPlay);

        return () => {
            a.removeEventListener("error", onError);
            a.removeEventListener("canplay", onCanPlay);
        };
    }, []);


    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY || 0);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        let rafId = null;
        const sizesMap = {
            "--fs-hero-title": [28, 0.06, 64],
            "--fs-hero-subtitle": [20, 0.045, 44],
            "--fs-body": [14, 0.012, 18],
            "--fs-btn": [12, 0.01, 16],
        };

        function applySizes() {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            Object.entries(sizesMap).forEach(([varName, [minPx, vwFactor, maxPx]]) => {
                const fluid = vw * vwFactor;
                const clamped = Math.min(maxPx, Math.max(minPx, fluid));
                const even = roundEven(clamped);
                document.documentElement.style.setProperty(varName, `${even}px`);
            });
        }

        function onResize() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                applySizes();
                rafId = null;
            });
        }

        applySizes();
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    async function togglePlay(e) {
        const a = audioRef.current;
        if (!a) return;

        // защитим от повторных параллельных вызовов
        if (playPromiseRef.current) return;

        if (a.paused) {
            try {
                console.log("Attempting to play, src:", a.currentSrc || a.src);
                const p = a.play();
                playPromiseRef.current = p;
                await p; // ждём либо успешного старта, либо reject
                setPlaying(true);
                e?.preventDefault();
                const el = inviteRef.current || document.getElementById("invitation");
                if (el) {
                    const headerOffset = -200;
                    const rect = el.getBoundingClientRect();
                    const docTop = window.pageYOffset || document.documentElement.scrollTop;
                    const targetY = rect.top + docTop - headerOffset;
                    window.scrollTo({ top: targetY, behavior: "smooth" });
                } else {
                    console.warn("Invite target not found");
                }
                setIsTriggered(true);
            } catch (err) {
                console.warn("Play failed (caught)", err);
                setPlaying(false);
            } finally {
                playPromiseRef.current = null;
            }
        } else {
            try {
                a.pause();
            } catch (err) {
                console.warn("Pause failed", err);
            }
            setPlaying(false);
            setIsTriggered(false);
            playPromiseRef.current = null;
        }
    }


    useEffect(() => {
        let startY = 0;

        const getScroller = () =>
            document.scrollingElement || document.documentElement || document.body;

        const onTouchStart = (e) => {
            if (!e.touches || e.touches.length === 0) return;
            startY = e.touches[0].clientY;
        };

        const onTouchMove = (e) => {
            if (!e.touches || e.touches.length !== 1) return;
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            const scroller = getScroller();
            const scrollTop = scroller.scrollTop;
            const scrollHeight = scroller.scrollHeight;
            const clientHeight = window.innerHeight || document.documentElement.clientHeight;

            const isAtTop = scrollTop <= 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

            // Only prevent default when user tries to scroll past the page edges
            if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
                e.preventDefault();
            }

            startY = currentY;
        };

        document.addEventListener("touchstart", onTouchStart, { passive: true });
        document.addEventListener("touchmove", onTouchMove, { passive: false });

        return () => {
            document.removeEventListener("touchstart", onTouchStart);
            document.removeEventListener("touchmove", onTouchMove);
        };
    }, []);

    useEffect(() => {
        return () => {
            const a = audioRef.current;
            if (a) a.pause();
        };
    }, []);

    return (
        <div className="page">
            <audio ref={audioRef} src="/wedding/wedding-music.mp3" preload="auto" />

            <main className="main-content">
                <div className="hero-section">
                    <div className="hero-container">
                        <img src="./image-1.webp" alt="Wedding invitation hero" className="hero__img"  />
                        <img src="./wedding-logo.webp" alt="Logo invitation hero" className="logo__img" />

                        <div className="hero-block">
                            <h1 className="hero-title">YEGHIAZAR &amp; MAYRANUSH</h1>
                            <div className="line" />
                            <h1 className="hero-subtitle">Our forever begins today</h1>
                        </div>

                        <div className={`play_contain ${isTriggered ? "trigger" : ""}`} onClick={(e) => togglePlay(e)}>
                            <div className="play_btn" title="Play/Pause">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>

                    <div className="sing-container" id="invitation" ref={inviteRef} >
                        <a
                            href="#invitation"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = inviteRef.current || document.getElementById("invitation");
                                console.log("scroll target:", el);
                                if (el) {
                                    const headerOffset = -160;
                                    const rect = el.getBoundingClientRect();
                                    const docTop = window.pageYOffset || document.documentElement.scrollTop;
                                    const targetY = rect.top + docTop - headerOffset;
                                    window.scrollTo({ top: targetY, behavior: "smooth" });
                                } else {
                                    console.warn("Invite target not found");
                                }
                            }}
                            role="button"
                            aria-label="Scroll to invitation"
                        >
                            <div className="arrow-4">
                                <span className="arrow-4-left"></span>
                                <span className="arrow-4-right"></span>
                            </div>
                        </a>
                    </div>



                    <div className="story-section">
                        <motion.h1
                            className="story-title"
                            initial={{ opacity: 0, x: 80 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 80 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            LOVE STORY
                        </motion.h1>

                        <motion.div
                            className="story-line"
                            initial={{ scaleY: 0, opacity: 0 }}
                            whileInView={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            aria-hidden="true"
                        />

                        <div className="story-images-container">
                            <motion.img
                                className="story-image story-image-left"
                                initial={{ opacity: 0, x: -80 }}
                                whileInView={{ opacity: 1, x: 60 }}
                                exit={{ opacity: 0, x: -80 }}
                                transition={{ duration: 2 }}
                                viewport={{ once: true, amount: 0.2 }}
                                loading="lazy"
                                src="./image-2.webp"
                            />

                            <motion.img
                                className="story-image story-image-right"
                                initial={{ opacity: 0, x: 80 }}
                                whileInView={{ opacity: 1, x: -60 }}
                                exit={{ opacity: 0, x: 80 }}
                                transition={{ duration: 2 }}
                                viewport={{ once: true, amount: 0.2 }}
                                loading="lazy"
                                src="./image-3.webp"
                            />
                        </div>
                    </div>
                <div className="gradient-overlay" />
                </div>


                <div className="invitation-section">
                    <motion.h2 className="invitation-subtitle"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Ընկերներ և բարեկամներ</motion.h2>

                    <motion.h3 className="invitation-text"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        Սիրով հրավիրում ենք Ձեզ՝ կիսելու մեզ հետ մեր կյանքի<br />
                        կարևոր և հիշարժան օրը:
                    </motion.h3>

                    <motion.h2 className="invitation-cta"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        Սպասում ենք Ձեզ մեր հարսանիքին
                    </motion.h2>

                    <motion.h1
                        className="date-number"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        19
                    </motion.h1>

                    <motion.h1
                        className="date-number"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        10
                    </motion.h1>

                    <motion.h1
                        className="date-number"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        25
                    </motion.h1>

                    <motion.div
                        className="date-line"
                        initial={{ scaleY: 0, opacity: 0 }}
                        whileInView={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        aria-hidden="true"
                    />

                    <motion.h2 className="countdown-label"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >ՄՆԱՑ</motion.h2>

                    <CountdownTimer />
                </div>

                <div className="gallery-section">
                    <motion.img
                        className="gallery-image gallery-image-left"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./image-4.webp"
                    />

                    <motion.img
                        className="gallery-image gallery-image-right"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./image-5.webp"
                    />
                </div>

                <div className="wide-gallery-section">
                    <motion.img
                        className="side-image side-image-left"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./image-6.webp"
                    />

                    <motion.img
                        className="side-image side-image-right"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./image-7.webp"
                    />
                </div>

                <div className="program-section">
                    <motion.h2 className="program-title"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Օրվա Ծրագիրը</motion.h2>

                    <motion.div
                        className="program-line"
                        initial={{ scaleY: 0, opacity: 0 }}
                        whileInView={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        aria-hidden="true"
                    />

                    <motion.img
                        className="program-icon heart-icon"
                        initial={{ opacity: 0, y: 80 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./heart.webp"
                    />
                    <motion.h2 className="program-subtitle"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >ՀԱՐՍԻ ՏՈՒՆ</motion.h2>
                    <motion.h2 className="program-time"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >11։00</motion.h2>
                    <motion.h2 className="program-location"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Դավթաշեն 2-րդ թաղամաս, 13/47</motion.h2>
                    <MapLinkButton lat={40.228214} lng={44.490654} placeId="" label="Ինչպես հասնել"></MapLinkButton>
                    <motion.img
                        className="program-icon rings-icon"
                        initial={{ opacity: 0, y: 80 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./rings.webp"
                    />
                    <motion.h2 className="program-subtitle"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >ՊՍԱԿԱԴՐՈՒԹՅՈՒՆ</motion.h2>
                    <motion.h2 className="program-time"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >14։00 <br /> Սուրբ Հռիփսիմե եկեղեցի</motion.h2>
                    <motion.h2 className="program-location"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Արմավիրի մարզ, <br /> ք․ Վաղարշապատ</motion.h2>
                    <MapLinkButton placeId="ChIJeXjuRd-VakAROhZapX043F4" label="Ինչպես հասնել"></MapLinkButton>
                    <motion.img
                        className="program-icon pen-heart-icon"
                        initial={{ opacity: 0, y: 80 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./home.webp"
                    />
                    <motion.h2 className="program-subtitle"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Փեսայի տուն</motion.h2>
                    <motion.h2 className="program-time"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >15:30</motion.h2>
                    <motion.h2 className="program-location"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Արմավիրի մարզ, ք․Արմավիր, <br />Պարույր Սևակի փողոց, 3</motion.h2>
                    <MapLinkButton lat={40.159627} lng={44.044537} placeId="" label="Ինչպես հասնել"></MapLinkButton>
                    <motion.img
                        className="program-icon glasses-icon"
                        initial={{ opacity: 0, y: 80 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        loading="lazy"
                        src="./glasses.webp"
                    />
                    <motion.h2 className="program-subtitle"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Հարսանեկան հանդիսություն</motion.h2>
                    <motion.h2 className="program-time"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >17:30 <br /> «Ռենեսանս» <br /> ռեստորանային <br /> համալիր</motion.h2>
                    <motion.h2 className="program-location"
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: false, amount: 0.2 }}
                    >ք․ Երևան</motion.h2>
                    <MapLinkButton placeId="ChIJpWYupr2-akARrnU_dw7cfFY" label="Ինչպես հասնել"></MapLinkButton>
                    <motion.h2 className="confirmation-text"
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 2 }}
                        viewport={{ once: true, amount: 0.2 }}
                    >Խնդրում ենք հաստատել Ձեր ներկայությունը <br />միջոցառմանը</motion.h2>
                    <div>
                        {formSubmitted ? (
                            <motion.div
                                className="success-message"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                Շնորհակալություն հաստատելու համար!
                            </motion.div>
                        ) : (
                            <FormResonse></FormResonse>
                        )}
                    </div>
                </div>
            </main>

            <footer className="footer">
            </footer>
        </div>
    );
}

const HARDCODED_TARGET = new Date(2025, 9, 19, 11, 0, 0);

function CountdownTimer() {
    const [target] = useState(HARDCODED_TARGET);
    const [now, setNow] = useState(new Date());
    const finishedRef = useRef(false);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const remaining = (() => {
        if (!target) return null;
        const total = target.getTime() - now.getTime();
        if (total <= 0) return { finished: true, total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        const secondsTotal = Math.floor(total / 1000);
        const days = Math.floor(secondsTotal / (24 * 3600));
        const hours = Math.floor((secondsTotal % (24 * 3600)) / 3600);
        const minutes = Math.floor((secondsTotal % 3600) / 60);
        const seconds = Math.floor(secondsTotal % 60);
        return { finished: false, total, days, hours, minutes, seconds };
    })();

    function two(n) {
        return String(n).padStart(2, "0");
    }

    useEffect(() => {
        if (remaining && remaining.finished && !finishedRef.current) {
            finishedRef.current = true;
        }
    }, [remaining]);

    return (
        <div className="countdown-container">
            <div className="countdown-grid">
                {remaining == null ? (
                    <div>Цель не установлена</div>
                ) : remaining.finished ? (
                    <div className="countdown-finished">Событие наступило</div>
                ) : (
                    <>
                        <div className="countdown-item">
                            <motion.div className="countdown-value"
                                initial={{ opacity: 0, y: -40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}
                            >{remaining.days}</motion.div>
                            <motion.div className="countdown-label"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}
                            >Օր</motion.div>
                        </div>
                        <motion.div
                            className="countdown-line"
                            initial={{ scaleY: 0, opacity: 0 }}
                            whileInView={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            aria-hidden="true"
                        />
                        <div className="countdown-item">
                            <motion.div className="countdown-value"
                                initial={{ opacity: 0, y: -40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}>{two(remaining.hours)}</motion.div>
                            <motion.div className="countdown-label"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}>Ժամ</motion.div>
                        </div>
                        <motion.div
                            className="countdown-line"
                            initial={{ scaleY: 0, opacity: 0 }}
                            whileInView={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            aria-hidden="true"
                        />
                        <div className="countdown-item">
                            <motion.div className="countdown-value"
                                initial={{ opacity: 0, y: -40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}>{two(remaining.minutes)}</motion.div>
                            <motion.div className="countdown-label"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}>Րոպե</motion.div>
                        </div>
                        <motion.div
                            className="countdown-line"
                            initial={{ scaleY: 0, opacity: 0 }}
                            whileInView={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            aria-hidden="true"
                        />
                        <div className="countdown-item">
                            <motion.div className="countdown-value"
                                initial={{ opacity: 0, y: -40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}>{two(remaining.seconds)}</motion.div>
                            <motion.div className="countdown-label"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 40 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true, amount: 0.2 }}>Վարկյան</motion.div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function MapLinkButton({
                                          placeId = "",
                                          lat = null,
                                          lng = null,
                                          label = "View place",
                                          className = "program-btn",
                                          forceBrowser = true,
                                          children,
                                          ...rest
                                      }) {
    const encodedLabel = encodeURIComponent(label || "");
    const encodedPlaceId = placeId ? encodeURIComponent(placeId) : "";


// Ссылка на web: если есть placeId — используем query_place_id, иначе — координаты.
    const googleMapsWeb = encodedPlaceId
        ? `https://www.google.com/maps/search/?api=1&query=${encodedLabel}&query_place_id=${encodedPlaceId}`
        : (lat != null && lng != null
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
                : null
        );


    function handleClick(e) {
        e.preventDefault();


        if (forceBrowser) {
            if (!googleMapsWeb) {
                console.error(
                    "MapLinkButton: forceBrowser=true but neither placeId nor lat/lng provided — aborting."
                );
                return;
            }
// Открываем только веб-версию Google Maps в новой вкладке
            window.open(googleMapsWeb, "_blank", "noopener,noreferrer");
            return;
        }


// Если forceBrowser == false — всё равно открываем web-ссылку, но при отсутствии данных
// можно попробовать открыть общий поиск по метке
        const fallback = googleMapsWeb ?? `https://www.google.com/maps/search/?api=1&query=${encodedLabel}`;
        window.open(fallback, "_blank", "noopener,noreferrer");
    }


// href полезен для правого клика / no-JS
    const hrefFallback = googleMapsWeb ?? `https://www.google.com/maps/search/?api=1&query=${encodedLabel}`;


    return (
        <motion.a
            className={className}
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.2 }}
            href={hrefFallback}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            {...rest}
        >
            {children ?? label}
        </motion.a>
    );
}

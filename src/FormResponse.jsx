import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import "./index.css";
import "./FormResponse.css";

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwIr_dfvSNCXuamzu1ieVzA3Swzee1jtFhgFF97hZwQXBVGeV-GQMgvJlgT0Qg77OWm/exec";
const SECRET_TOKEN = "my_secret_12345";
const MAX_GUESTS = 10;

const OPTION_TEXTS = {
    side: {
        wife: "Հարսի կողմից",
        groom: "Փեսայի կողմից",
    },
    attending: {
        yes: "Այո, գալու եմ",
        no: "Ոչ, չեմ գալու",
    },
};

export default function FormResponse() {
    const [name, setName] = useState("");
    const [side, setSide] = useState("wife");
    const [attending, setAttending] = useState("yes");
    const [guests, setGuests] = useState(1);
    const [status, setStatus] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [nameError, setNameError] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);
    const iframeRef = useRef(null);
    const formRef = useRef(null);
    const timeoutRef = useRef(null);

    // Validate name on change
    const validateName = (value) => {
        if (!value.trim()) {
            setNameError("Անունը պարտադիր է");
            return false;
        } else if (value.trim().length < 2) {
            setNameError("Անունը պետք է պարունակի առնվազն 2 տառ");
            return false;
        } else if (!/^[\p{L} ]+$/u.test(value.trim())) {
            setNameError("Անունը պետք է պարունակի միայն տառեր");
            return false;
        } else {
            setNameError(false);
            return true;
        }
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        if (nameTouched) {
            validateName(value);
        }
    };

    const handleNameBlur = () => {
        setNameTouched(true);
        validateName(name);
    };

    function validate() {
        // Validate name
        if (!validateName(name)) {
            // Scroll to name input
            setTimeout(() => {
                const nameInput = document.querySelector('input[name="fullName"]');
                if (nameInput) {
                    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    nameInput.focus();
                }
            }, 100);
            return false;
        }

        if (!(side === "wife" || side === "groom")) {
            alert("Խնդրում ենք ընտրել համապատասխան կողմից / Выберите, пожалуйста, сторону.");
            return false;
        }

        if (!(attending === "yes" || attending === "no")) {
            alert("Խնդրում ենք ընտրել՝ գալիս եք արդյոք / Пожалуйста, укажите, придёте ли вы.");
            return false;
        }

        if (attending === "yes") {
            if (guests === "" || guests == null || Number.isNaN(Number(guests))) {
                alert("Խնդրում ենք մուտքագրել ճիշտ հյուրերի քանակը / Укажите корректное число гостей.");
                return false;
            }

            const g = Number(guests);
            if (!Number.isInteger(g) || g < 1 || g > MAX_GUESTS) {
                alert(`Խնդրում ենք մուտքագրել հյուրերի թիվ՝ 1-ից ${MAX_GUESTS}-ը ներառյալ / Введите число гостей от 1 до ${MAX_GUESTS}.`);
                return false;
            }
        }

        return true;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setNameTouched(true);

        if (!validate()) return;

        setStatus("sending");

        let iframe = iframeRef.current;
        if (!iframe) {
            iframe = document.createElement("iframe");
            const nameId = "hidden_iframe_" + Date.now();
            iframe.name = nameId;
            iframe.style.display = "none";
            document.body.appendChild(iframe);
            iframeRef.current = iframe;
        }

        iframe.onload = null;

        let form = document.createElement("form");
        form.style.display = "none";
        form.method = "POST";
        form.action = WEB_APP_URL;
        form.target = iframe.name;

        function appendInput(nameAttr, value) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = nameAttr;
            input.value = value;
            form.appendChild(input);
        }

        appendInput("fullName", name.trim());
        appendInput("side", side === "wife" ? OPTION_TEXTS.side.wife : OPTION_TEXTS.side.groom);
        appendInput("coming", attending === "yes" ? OPTION_TEXTS.attending.yes : OPTION_TEXTS.attending.no);
        appendInput("guests", attending === "yes" ? String(guests) : "0");
        appendInput("_token", SECRET_TOKEN);

        document.body.appendChild(form);
        formRef.current = form;

        const onLoad = () => {
            clearTimeout(timeoutRef.current);
            setStatus("ok");
            setFormSubmitted(true);

            setName("");
            setSide("wife");
            setAttending("yes");
            setGuests(1);
            setNameError(false);
            setNameTouched(false);

            setTimeout(() => {
                try { form.remove(); } catch (_) {}
                try { iframe.remove(); iframeRef.current = null; } catch (_) {}
            }, 500);
        };

        iframe.addEventListener("load", onLoad, { once: true });

        try {
            form.submit();
        } catch (err) {
            console.error("form.submit error", err);
            setStatus("error");
            try { form.remove(); } catch (_) {}
            try { iframe.remove(); iframeRef.current = null; } catch (_) {}
            return;
        }

        timeoutRef.current = setTimeout(() => {
            setStatus("error");
            alert("Չհաջողվեց ուղարկել տվյալները — ստուգեք WEB_APP_URL, SECRET_TOKEN և Apps Script deployment settings.\n(Also check Apps Script logs.)");
            try { form.remove(); } catch (_) {}
            try { iframe.remove(); iframeRef.current = null; } catch (_) {}
        }, 10000);
    };

    return (
        <div>
            <div>
                {formSubmitted ? (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            backgroundColor: "rgba(100, 100, 100, 0.7)"
                        }}
                    >
                        <motion.div
                            className="modal-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            style={{
                                padding: 24,
                                borderRadius: 12,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                                background: "white",
                                maxWidth: 420,
                                textAlign: "center"
                            }}
                        >
                            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Շնորհակալություն</div>
                            <div style={{ marginBottom: 16 }}>Ձեր պատասխանը հաջողությամբ ուղարկվել է.</div>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button className="btn btn-primary" onClick={() => { setFormSubmitted(false); setStatus(null); }}>
                                    Լավ
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.form
                        className="rsvp-form"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmit}
                    >
                        <div className="form-row">
                            <label className="label">Անուն Ազգանուն</label>
                            <input
                                className={`input ${nameError ? 'input-error' : ''}`}
                                name="fullName"
                                value={name}
                                onChange={handleNameChange}
                                onBlur={handleNameBlur}
                                required
                                placeholder="Օր. Աննա Մամիկոնյան"
                                aria-label="full name"
                            />
                            {nameError && (
                                <motion.div
                                    className="error-text"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ marginTop: 8, color: '#e74c3c', fontSize: '14px', display: 'flex', alignItems: 'center' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    {nameError}
                                </motion.div>
                            )}
                        </div>

                        <div className="form-row">
                            <label className="label">Ո՞ր կողմից եք</label>
                            <div className="radio-group" style={{ marginTop: 8 }}>
                                <label className="radio">
                                    <input
                                        type="radio"
                                        name="side"
                                        checked={side === "wife"}
                                        onChange={() => setSide("wife")}
                                    />{' '}
                                    {OPTION_TEXTS.side.wife}
                                </label>
                                <label className="radio">
                                    <input
                                        type="radio"
                                        name="side"
                                        checked={side === "groom"}
                                        onChange={() => setSide("groom")}
                                    />{' '}
                                    {OPTION_TEXTS.side.groom}
                                </label>
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="label">Գալու՞ եք</label>
                            <div className="radio-group">
                                <label className="radio">
                                    <input
                                        style={{color: "#000", backgroundColor: '#000'}}
                                        type="radio"
                                        name="attending"
                                        checked={attending === "yes"}
                                        onChange={() => {
                                            setAttending("yes")
                                            setGuests(1)
                                        }}
                                    />{' '}
                                    {OPTION_TEXTS.attending.yes}
                                </label>
                                <label className="radio">
                                    <input
                                        type="radio"
                                        name="attending"
                                        checked={attending === "no"}
                                        onChange={() => {
                                            setAttending("no");
                                            setGuests(0);
                                        }}
                                    />{' '}
                                    {OPTION_TEXTS.attending.no}
                                </label>
                            </div>
                        </div>

                        {attending !== "no" &&
                            <div className="form-row">
                                <label className="label">Հյուրերի թիվ</label>
                                <input
                                    className="input"
                                    type="number"
                                    min={0}
                                    max={MAX_GUESTS}
                                    step={1}
                                    value={guests}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "") {
                                            setGuests("");
                                            return;
                                        }
                                        const n = Number(v);
                                        if (Number.isNaN(n)) return;
                                        setGuests(Math.max(0, Math.min(MAX_GUESTS, Math.trunc(n))));
                                    }}
                                    disabled={attending !== "yes"}
                                    aria-label="guests"
                                />
                                {attending === 'yes' && (guests !== '' && Number(guests) < 1) && (
                                    <div className="error-text" style={{ marginTop: 8 }}>
                                        Եթե դուք գալու եք, խնդրում ենք նշել առնվազն 1 հյուր / Укажите хотя бы 1 гостя, если вы приходите.
                                    </div>
                                )}
                            </div>
                        }

                        <div className="actions">
                            <button className="btn btn-primary" type="submit" disabled={status === "sending" || (attending === 'yes' && (guests === '' || Number(guests) < 1)) || nameError}>
                                {status === "sending" ? "Ուղարկում ենք..." : "Հաստատել"}
                            </button>
                        </div>

                        {status === "error" && <div className="error-text">Մենք ունենք խնդիր, խնդրում ենք կրկին փորձել։</div>}
                    </motion.form>
                )}
            </div>
        </div>
    );
}
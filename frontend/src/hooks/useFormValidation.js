import { useState } from "react";

// Hook custom pentru validarea unui formular generic.
// Primește un obiect `rules` care descrie regulile per câmp.
// Returnează: errors (obiect), validate (funcție), clearErrors
export function useFormValidation(rules) {
  // `errors` — obiect { author: "mesaj eroare", quote: "mesaj eroare" }
  // Câmpurile fără eroare nu apar în obiect.
  const [errors, setErrors] = useState({});

  // Validează datele formularului față de regulile definite.
  // Returnează true dacă totul este valid, false dacă există erori.
  function validate(data) {
    const newErrors = {};

    // Iterăm prin fiecare câmp din rules și aplicăm validările
    for (const field in rules) {
      const value = (data[field] || "").trim();
      const rule  = rules[field];

      if (rule.required && !value) {
        newErrors[field] = rule.requiredMsg || `Câmpul este obligatoriu.`;
        continue; // dacă lipsește valoarea, nu mai verificăm lungimea
      }
      if (rule.minLength && value.length < rule.minLength) {
        newErrors[field] = rule.minLengthMsg ||
          `Minim ${rule.minLength} caractere.`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        newErrors[field] = rule.maxLengthMsg ||
          `Maxim ${rule.maxLength} caractere.`;
      }
    }

    setErrors(newErrors);
    // Formularul este valid dacă nu există nicio cheie în newErrors
    return Object.keys(newErrors).length === 0;
  }

  function clearErrors() {
    setErrors({});
  }

  return { errors, validate, clearErrors };
}
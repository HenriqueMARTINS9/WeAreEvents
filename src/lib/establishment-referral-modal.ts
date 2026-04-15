import { createContext, useContext } from "react";

export interface EstablishmentReferralModalValue {
  openModal: () => void;
  closeModal: () => void;
}

export const EstablishmentReferralModalContext = createContext<EstablishmentReferralModalValue | null>(null);

export const useEstablishmentReferralModal = () => {
  const context = useContext(EstablishmentReferralModalContext);

  if (!context) {
    throw new Error("useEstablishmentReferralModal must be used within EstablishmentReferralModalProvider.");
  }

  return context;
};

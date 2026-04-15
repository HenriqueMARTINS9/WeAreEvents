import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EstablishmentReferralModalContext } from "@/lib/establishment-referral-modal";
import EstablishmentReferralModal from "./EstablishmentReferralModal";

interface EstablishmentReferralModalProviderProps {
  children: ReactNode;
}

const EstablishmentReferralModalProvider = ({ children }: EstablishmentReferralModalProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldOpenFromUrl =
      location.hash === "#referencer-etablissement" || searchParams.get("referencer") === "1";

    if (!shouldOpenFromUrl) return;

    setIsOpen(true);

    if (location.hash || searchParams.has("referencer")) {
      searchParams.delete("referencer");
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString() ? `?${searchParams.toString()}` : "",
          hash: "",
        },
        { replace: true },
      );
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  const contextValue = useMemo(
    () => ({
      openModal,
      closeModal,
    }),
    [closeModal, openModal],
  );

  return (
    <EstablishmentReferralModalContext.Provider value={contextValue}>
      {children}
      <EstablishmentReferralModal isOpen={isOpen} onClose={closeModal} />
    </EstablishmentReferralModalContext.Provider>
  );
};

export default EstablishmentReferralModalProvider;

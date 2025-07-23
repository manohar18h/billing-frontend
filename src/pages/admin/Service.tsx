import React, { useRef, useState, useEffect, RefObject } from "react";
import {
  Box,
  Button,
  useTheme,
  Theme,
  styled,
} from "@mui/material";
import WorkerStock        from "./WorkerStock";
import LotWork            from "./LotWork";
import RepairWork         from "./RepairWork";
import WorkerTransaction  from "./WorkerTransaction";

type Section = "add" | "lot" | "repair" | "tx";

const TabBtn = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active, theme }) => ({
  position: "relative",
  fontWeight: 600,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -4,
    height: 3,
    borderRadius: 3,
    background: active ? theme.palette.primary.main : "transparent",
    transition: "background .3s",
  },
}));

  const AdminService: React.FC = () => {
  const addRef     = useRef<HTMLDivElement>(null);
  const lotRef     = useRef<HTMLDivElement>(null);
  const repairRef  = useRef<HTMLDivElement>(null);
  const txRef      = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState<Section>("add");


const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
  ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};

  useEffect(() => {
    const options = { root: null, rootMargin: "-50% 0px -50% 0px" }; // trigger roughly when section is centred
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.getAttribute("data-section") as Section;
          setActive(id);
        }
      });
    }, options);

    [addRef, lotRef, repairRef, txRef].forEach((r) => r.current && io.observe(r.current));
    return () => io.disconnect();
  }, []);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="center" gap={6} mb={3}>
        <TabBtn active={active === "add"}    onClick={() => scrollTo(addRef)}>Add Stock</TabBtn>
        <TabBtn active={active === "lot"}    onClick={() => scrollTo(lotRef)}>Lot Work</TabBtn>
        <TabBtn active={active === "repair"} onClick={() => scrollTo(repairRef)}>Repair Work</TabBtn>
        <TabBtn active={active === "tx"}     onClick={() => scrollTo(txRef)}>Transaction</TabBtn>
      </Box>

      <Box display="flex" flexDirection="column" gap={12}>

        <Box ref={addRef}    data-section="add">
          <WorkerStock />
        </Box>

        <Box ref={lotRef}    data-section="lot">
          <LotWork />
        </Box>

        <Box ref={repairRef} data-section="repair">
          <RepairWork />
        </Box>

        <Box ref={txRef}     data-section="tx">
          <WorkerTransaction />
        </Box>

      </Box>
    </Box>
  );
};

export default AdminService;

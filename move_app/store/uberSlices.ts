import { UberState } from "@/type";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  origin: null,
  destination: null,
  travelTimeInformation: null,
};

export const uberSlices = createSlice({
  name: "uber",
  initialState,
  reducers: {
    setOrigin: (state, action) => {
      state.origin = action.payload;
    },
    setDestination: (state, action) => {
      state.destination = action.payload;
    },
    setTravelTimeInformation: (state, action) => {
      state.travelTimeInformation = action.payload;
    },
  },
});

export const { setOrigin, setDestination, setTravelTimeInformation } =
  uberSlices.actions;

// Selectors
export const selectOrigin = (state: UberState) => state.uber.origin;
export const selectDestination = (state: UberState) => state.uber.destination;
export const selectTravelTimeInformation = (state: UberState) =>
  state.uber.travelTimeInformation;

export default uberSlices.reducer;

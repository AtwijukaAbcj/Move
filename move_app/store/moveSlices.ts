import { MoveState } from "@/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  origin: null,
  destination: null,
  travelTimeInformation: null,
};

export const moveSlices = createSlice({
  name: "move",
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
  moveSlices.actions;

// Selectors
export const selectOrigin = (state: MoveState) => state.move.origin;
export const selectDestination = (state: MoveState) => state.move.destination;
export const selectTravelTimeInformation = (state: MoveState) =>
  state.move.travelTimeInformation;

export default moveSlices.reducer;

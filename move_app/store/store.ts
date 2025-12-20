import { configureStore } from "@reduxjs/toolkit";
import uberReducer from "./uberSlices";

export const store = configureStore({
  reducer: {
    uber: uberReducer,
  },
});

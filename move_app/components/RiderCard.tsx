import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { uberLux, uberX, uberXL } from "@/assets/images";
import { TabBarIcon } from "./navigation/TabBarIcon";
import tw from "twrnc";
import { FlatList } from "react-native";
import { Image } from "react-native";
import { selectTravelTimeInformation } from "@/store/uberSlices";
import { useSelector } from "react-redux";
import { useNavigation } from "expo-router";
type RideOption = {
  _id: string;
  title: string;
  multiplier: number;
  image: any;
};
const data: RideOption[] = [
  {
    _id: "Uber-X-123",
    title: "UberX",
    multiplier: 1,
    image: uberX,
  },
  {
    _id: "Uber-XL-456",
    title: "Uber XL",
    multiplier: 1.2,
    image: uberXL,
  },
  {
    _id: "Uber-LUX-789",
    title: "Uber LUX",
    multiplier: 1.75,
    image: uberLux,
  },
];

const RiderCard = ({ setShowRider }: any) => {
  const [selected, setSelected] = useState<RideOption | null>(null);
  const travelTimeInformation = useSelector(selectTravelTimeInformation) || {
    distance: { text: "No distance", value: 0 },
    duration: { text: "No duration", value: 0 },
  };

  const CHARGE_RATE = 1.7;
  const navigation = useNavigation();
  return (
    <View style={tw`-mt-8`}>
      <View>
        <TouchableOpacity
          onPress={() => setShowRider(false)}
          style={tw`absolute top-1 left-5 rounded-full bg-gray-200 p-1 z-50`}
        >
          <TabBarIcon name="arrow-back" size={20} />
        </TouchableOpacity>
        <Text style={tw`text-center font-medium text-lg mb-2`}>
          Select a Ride - {travelTimeInformation?.distance?.text}
        </Text>
      </View>
      <FlatList
        data={data}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item?._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            style={tw`flex-row items-center justify-between rounded-md px-2 ${
              item?._id === selected?._id ? "bg-gray-200" : "bg-white"
            }`}
          >
            <Image
              source={item?.image}
              style={{ width: 100, height: 100, resizeMode: "contain" }}
            />
            <View>
              <Text style={tw`text-xl font-semibold`}>{item?.title}</Text>
              <Text>{travelTimeInformation?.duration?.text} Travel time</Text>
            </View>
            <Text style={tw`text-lg font-semibold`}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                (travelTimeInformation?.duration?.value *
                  CHARGE_RATE *
                  item?.multiplier) /
                  100
              )}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={tw`py-3 mt-3 rounded-md ${
          selected ? "bg-black" : "bg-gray-300"
        }`}
        disabled={!selected}
        onPress={() => navigation.goBack()}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>
          Choose {selected?.title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RiderCard;

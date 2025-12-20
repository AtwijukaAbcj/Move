import { View, Text, FlatList, Image } from "react-native";
import React from "react";
import { navData } from "@/constants";
import tw from "twrnc";
import { Link } from "expo-router";
import { TabBarIcon } from "./navigation/TabBarIcon";
import { useSelector } from "react-redux";
import { selectOrigin } from "@/store/uberSlices";

const NavOptions = () => {
  const origin = useSelector(selectOrigin);
  return (
    <FlatList
      data={navData}
      horizontal
      keyExtractor={(item) => item?._id}
      renderItem={({ item }) => (
        <View
          style={tw`mt-3 pl-6 p-4 bg-gray-200 mr-4 rounded-lg border border-gray-300`}
        >
          <View style={tw`${origin ? "opacity-100" : "opacity-20"}`}>
            <Image
              source={item?.image}
              style={{ width: 120, height: 120, resizeMode: "contain" }}
            />
            <Text style={tw`py-2 text-lg font-semibold`}>{item?.title}</Text>
            <Link href={"/map"} disabled={!origin}>
              <View
                style={tw`p-2 bg-black rounded-full w-10 h-10 items-center justify-center`}
              >
                <TabBarIcon name="arrow-forward" size={18} color="#ffffff" />
              </View>
            </Link>
          </View>
        </View>
      )}
    />
  );
};

export default NavOptions;

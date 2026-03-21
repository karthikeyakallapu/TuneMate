/* eslint-disable react/prop-types */
import React from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import SliderItem from "./SliderItem";

const MusicSlider = React.forwardRef(
  (
    {
      musicList,
      title,
      settings = {
        className: "slider",
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        autoplay: false,
        variableWidth: true,
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 5,
              slidesToScroll: 3,
              infinite: true,
            },
          },
          {
            breakpoint: 767,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 2,
              infinite: true,
            },
          },
        ],
      },
      sliderRef,
    },
    ref,
  ) => {
    const resolvedRef = ref || sliderRef;

    return (
      <div className="w-full mt-2">
        <div className="flex justify-between items-center ">
          <h1 className="text-2xl md:text-3xl jaro-head">{title}</h1>
        </div>

        <div className="relative overflow-hidden w-full">
          {musicList?.length > 0 && (
            <Slider ref={resolvedRef} {...settings} className="slider">
              {musicList.map((playlist) => (
                <SliderItem key={playlist.id} playlist={playlist} />
              ))}
            </Slider>
          )}
        </div>
      </div>
    );
  },
);

MusicSlider.displayName = "MusicSlider";

export default MusicSlider;

import { motion } from "motion/react";
import { useState } from "react";

export interface BentoCardProps {
  title: string;
  description: string;
  defaultImage?: string;
  hoverImage?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
  imagePosition?: "top" | "bottom" | "side" | "custom" | "side-custom" | "portfolio";
  imageScale?: number;
  imageWidth?: string;
  imageContainerStyle?: React.CSSProperties;
  customImageStyle?: React.CSSProperties;
  textContainerStyle?: React.CSSProperties;
  customVectorImage?: React.ReactNode;
}

export function BentoCard({
  title,
  description,
  defaultImage,
  hoverImage,
  bgColor,
  textColor = "#16273F",
  className = "",
  style,
  imagePosition = "bottom",
  imageScale = 1.0,
  imageWidth,
  customImageStyle,
  imageContainerStyle,
  textContainerStyle,
  customVectorImage,
}: BentoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if this is a PNG illustration (imported asset) or Unsplash image
  const isPNG = defaultImage && (defaultImage.includes('figma:asset') || defaultImage.startsWith('blob:'));
  
  // Check if this is the Portafolio card (large 2x2 card)
  const isPortfolio = className.includes('col-span-2 row-span-2');

  return (
    <motion.div
      className={`relative rounded-[6px] cursor-pointer group ${className}`}
      style={{ 
        backgroundColor: bgColor,
        overflow: className.includes('overflow-hidden') ? 'hidden' : 'visible',
        padding: imagePosition === "portfolio" ? "0" : "1rem",
        ...style, // Apply inline styles
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={customVectorImage ? {} : { scale: 1.02 }}
      animate={{
        boxShadow: isHovered 
          ? "0 10px 30px rgba(0, 0, 0, 0.12)" 
          : "0 0 0 rgba(0, 0, 0, 0)"
      }}
      transition={{ duration: 0 }}
    >
      {/* Custom Vector Image - Renders full component */}
      {customVectorImage && (
        <div className="absolute inset-0 pointer-events-none" style={{ overflow: className.includes('overflow-hidden') ? 'hidden' : 'visible' }}>
          {customVectorImage}
        </div>
      )}

      {/* Background Image - only for cards with Unsplash images */}
      {!isPNG && (
        <div className="absolute inset-0 overflow-hidden rounded-[6px]">
          <motion.div
            className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-20"
            style={{ backgroundImage: `url(${hoverImage})` }}
            initial={{ scale: 1.1 }}
            animate={{ scale: isHovered ? 1 : 1.1 }}
            transition={{ duration: 0.6 }}
          />
        </div>
      )}

      {/* Content */}
      <div
        className={`relative z-10 h-full flex ${
          imagePosition === "side" ? "flex-row gap-4" : 
          imagePosition === "side-custom" ? "flex-row" : 
          "flex-col"
        } justify-between`}
      >
        {/* Text Content - Always on top, protected from overlap */}
        <div 
          className={`${
            imagePosition === "side" ? "flex-1" : 
            imagePosition === "side-custom" ? "absolute top-0 left-[50%] w-[50%]" : 
            imagePosition === "portfolio" ? "absolute left-4 w-[212px]" :
            ""
          } flex-shrink-0 relative z-20`}
          style={imagePosition === "portfolio" ? { top: '376px' } : textContainerStyle}
        >
          <h3
            className="text-base md:text-lg lg:text-2xl font-semibold mb-1 md:mb-2 leading-tight"
            style={{ color: textColor }}
          >
            {title}
          </h3>
          <p
            className="text-xs md:text-sm opacity-80 line-clamp-2 md:line-clamp-3"
            style={{ color: textColor }}
          >
            {description}
          </p>
        </div>

        {/* Image Container - standard positioning */}
        {defaultImage && imagePosition !== "custom" && imagePosition !== "side-custom" && imagePosition !== "portfolio" && (
          <motion.div
            className={`
              ${imagePosition === "top" ? "mb-3 md:mb-4 order-first" : "mt-auto pt-3 md:pt-4"}
              ${imagePosition === "side" ? "w-32 md:w-40 lg:w-48 mt-0" : ""}
              relative w-full flex items-end justify-center flex-shrink-0
            `}
            style={{ 
              overflow: "visible",
              height: isPNG ? `${100 * imageScale}px` : '140px',
              minHeight: isPNG ? `${80 * imageScale}px` : '120px',
            }}
            animate={{ y: isHovered && imagePosition !== "side" ? -8 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={defaultImage}
              alt={title}
              className={`${customImageStyle}`}
              style={{ 
                filter: isPNG 
                  ? "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))" 
                  : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))",
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom center',
              }}
              animate={{ 
                scale: isHovered ? 1.05 : 1,
                filter: isHovered 
                  ? (isPNG ? "drop-shadow(0 10px 28px rgba(0, 0, 0, 0.15))" : "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.12))")
                  : (isPNG ? "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))" : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))")
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}

        {/* Side-custom positioned image - for side-by-side layout with custom positioning */}
        {defaultImage && imagePosition === "side-custom" && (
          <motion.div
            className="absolute left-0"
            style={{ 
              ...imageContainerStyle,
              overflow: 'hidden',
            }}
            animate={{ y: isHovered ? -8 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={defaultImage}
              alt={title}
              className={`${customImageStyle}`}
              style={{ 
                filter: isPNG 
                  ? "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))" 
                  : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))",
                ...customImageStyle,
              }}
              animate={{ 
                scale: isHovered ? 1.05 : 1,
                filter: isHovered 
                  ? (isPNG ? "drop-shadow(0 10px 28px rgba(0, 0, 0, 0.15))" : "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.12))")
                  : (isPNG ? "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))" : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))")
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}

        {/* Custom positioned image - for Figma exact positioning (absolute) */}
        {defaultImage && imagePosition === "custom" && (
          <motion.div
            style={imageContainerStyle}
            animate={{ y: isHovered ? -8 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={defaultImage}
              alt={title}
              className={`${customImageStyle}`}
              style={{ 
                filter: isPNG 
                  ? "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))" 
                  : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))",
                transform: 'translateY(10px)',
                ...customImageStyle,
              }}
              animate={{ 
                scale: isHovered ? 1.365 : 1.3,
                filter: isHovered 
                  ? (isPNG ? "drop-shadow(0 10px 28px rgba(0, 0, 0, 0.15))" : "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.12))")
                  : (isPNG ? "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))" : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))")
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}

        {/* Portfolio positioned image - centered with overflow on top */}
        {defaultImage && imagePosition === "portfolio" && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ 
              top: '-40px',
              height: '400px',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <motion.img
              src={defaultImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                objectPosition: 'center top',
              }}
              animate={{ 
                scale: isHovered ? 1.05 : 1,
                filter: isHovered 
                  ? "drop-shadow(0 10px 28px rgba(0, 0, 0, 0.15))"
                  : "drop-shadow(0 6px 16px rgba(0, 0, 0, 0.1))"
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
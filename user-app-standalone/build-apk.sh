#!/bin/bash
# Build APK Script for UbexGo User App (Linux/Mac)
# This script builds both debug and release APKs

echo "======================================"
echo "   UbexGo User App APK Build Script"
echo "======================================"
echo ""

# Navigate to android directory
cd "$(dirname "$0")/android" || exit 1

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo "Error: gradlew not found!"
    echo "Run 'npx expo prebuild --platform android' first to generate native files."
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Display menu
echo "Select build type:"
echo "1. Debug APK (faster, for testing)"
echo "2. Release APK (optimized, for distribution)"
echo "3. Both Debug and Release APKs"
echo ""

read -p "Enter your choice (1-3): " choice

build_debug_apk() {
    echo ""
    echo "Building Debug APK..."
    ./gradlew assembleDebug
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Debug APK built successfully!"
        echo "Location: android/app/build/outputs/apk/debug/app-debug.apk"
        
        if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
            size=$(du -h "app/build/outputs/apk/debug/app-debug.apk" | cut -f1)
            echo "Size: $size"
        fi
    else
        echo ""
        echo "✗ Debug APK build failed!"
        exit 1
    fi
}

build_release_apk() {
    echo ""
    echo "Building Release APK..."
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Release APK built successfully!"
        echo "Location: android/app/build/outputs/apk/release/app-release.apk"
        
        if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
            size=$(du -h "app/build/outputs/apk/release/app-release.apk" | cut -f1)
            echo "Size: $size"
        fi
    else
        echo ""
        echo "✗ Release APK build failed!"
        exit 1
    fi
}

clean_build() {
    echo ""
    echo "Cleaning previous builds..."
    ./gradlew clean
}

# Execute based on choice
case $choice in
    1)
        clean_build
        build_debug_apk
        ;;
    2)
        clean_build
        build_release_apk
        ;;
    3)
        clean_build
        build_debug_apk
        build_release_apk
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "   Build Process Complete!"
echo "======================================"

# Return to project root
cd ..




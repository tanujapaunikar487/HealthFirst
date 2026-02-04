export default function SocialDivider() {
    return (
        <div className="relative mt-2">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                    or
                </span>
            </div>
        </div>
    );
}
